const tg = window.Telegram.WebApp;
let currentTelegramUser = "Anonymous";

if (tg) {
    tg.expand();
    const user = tg.initDataUnsafe.user;
    if (user) {
        // Автоматично реєструємо/підтягуємо юзернейм або ім'я гравця з Телеграму
        currentTelegramUser = user.username || user.first_name || "Zheka";
        document.querySelector('.username').innerText = currentTelegramUser;
    }
}

const toggleBtn = document.getElementById('toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const graphBtn = document.getElementById('graph-btn');
const modal = document.getElementById('graph-modal');
const closeModal = document.getElementById('close-graph');
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const MAP_SIZE = 10000;
const BLOCK_SIZE = 100;

canvas.width = window.innerWidth - 340;
canvas.height = window.innerHeight;

let boughtPixels = JSON.parse(localStorage.getItem('local_pixels')) || [];
let currentX = null;
let currentY = null;
let currentPrice = 0;

let scale = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;
let isMoved = false;

toggleBtn.addEventListener('click', () => sidebar.classList.toggle('hidden'));

graphBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    setTimeout(renderChart, 50);
});

closeModal.addEventListener('click', () => modal.classList.add('hidden'));

modal.addEventListener('click', (e) => {
    if (e.target === modal) { modal.classList.add('hidden'); }
});

function updateInterfaceData() {
    document.getElementById('total-blocks-count').innerText = boughtPixels.length;

    const txList = document.getElementById('tx-list');
    if (boughtPixels.length === 0) {
        txList.innerHTML = '<div class="tx-empty">Історія операцій порожня</div>';
        return;
    }

    txList.innerHTML = '';
    const recentPurchases = [...boughtPixels].reverse().slice(0, 5);

    recentPurchases.forEach(tx => {
        const txItem = document.createElement('div');
        txItem.className = 'tx-item';
        txItem.innerHTML = `
            <div class="tx-details">
                <span class="tx-coords">Блок: X:${tx.x}, Y:${tx.y}</span>
                <span class="tx-price">Власник: @${tx.owner || 'Unknown'}</span>
            </div>
            <div class="tx-color-badge" style="background: ${tx.color}"></div>
        `;
        txList.appendChild(txItem);
    });
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= MAP_SIZE; i += BLOCK_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, MAP_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(MAP_SIZE, i); ctx.stroke();
    }

    boughtPixels.forEach(pixel => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, BLOCK_SIZE, BLOCK_SIZE);
    });

    if (currentX !== null && currentY !== null) {
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 3;
        ctx.strokeRect(currentX, currentY, BLOCK_SIZE, BLOCK_SIZE);
    }
    ctx.restore();
}

canvas.addEventListener('mousedown', (e) => {
    document.getElementById('pixel-info').classList.add('hidden');
    isDragging = true; isMoved = false;
    startX = e.clientX - offsetX; startY = e.clientY - offsetY;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    isMoved = true;
    offsetX = e.clientX - startX; offsetY = e.clientY - startY;
    drawGrid();
});

canvas.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;

    if (!isMoved) {
        const rect = canvas.getBoundingClientRect();
        const virtualX = (e.clientX - rect.left - offsetX) / scale;
        const virtualY = (e.clientY - rect.top - offsetY) / scale;

        if (virtualX >= 0 && virtualX < MAP_SIZE && virtualY >= 0 && virtualY < MAP_SIZE) {
            const clickedX = Math.floor(virtualX / BLOCK_SIZE) * BLOCK_SIZE;
            const clickedY = Math.floor(virtualY / BLOCK_SIZE) * BLOCK_SIZE;

            const existingPixel = boughtPixels.find(p => p.x === clickedX && p.y === clickedY);
            const infoBox = document.getElementById('pixel-info');

            if (existingPixel) {
                // ПОКАЗ ІНФОРМАЦІЇ: тепер з виведенням власника блоку (@username)
                infoBox.classList.remove('hidden');
                infoBox.style.left = (e.clientX + 15) + 'px';
                infoBox.style.top = (e.clientY + 15) + 'px';

                document.getElementById('info-content').innerHTML = `
                    <p><b>Координати:</b> X:${existingPixel.x}, Y:${existingPixel.y}</p>
                    <p><b>Власник:</b> <span style="color: #059669; font-weight:600;">@${existingPixel.owner || 'Anonym'}</span></p>
                    <a href="#" class="info-link-btn" id="open-link-trigger">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Перейти за лінком
                    </a>
                `;

                document.getElementById('open-link-trigger').addEventListener('click', (event) => {
                    event.preventDefault();
                    if (tg && tg.openLink) {
                        tg.openLink(existingPixel.link);
                    } else {
                        window.open(existingPixel.link, '_blank');
                    }
                });

            } else {
                infoBox.classList.add('hidden');
                currentX = clickedX;
                currentY = clickedY;

                const centerX = MAP_SIZE / 2;
                const centerY = MAP_SIZE / 2;
                const distance = Math.sqrt(Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2));
                currentPrice = Math.floor(15000 / (distance / 1200 + 1));

                document.getElementById('coords').innerText = `X: ${currentX}, Y: ${currentY}`;
                document.getElementById('price').innerText = currentPrice.toLocaleString();

                const buyBtn = document.getElementById('buy-btn');
                buyBtn.removeAttribute('disabled');
                buyBtn.classList.add('active');
                drawGrid();
            }
        }
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    document.getElementById('pixel-info').classList.add('hidden');
    const zoomFactor = 1.1;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const wheelX = (mouseX - offsetX) / scale;
    const wheelY = (mouseY - offsetY) / scale;

    if (e.deltaY < 0) { if (scale < 4.0) scale *= zoomFactor; }
    else { if (scale > 0.1) scale /= zoomFactor; }

    offsetX = mouseX - wheelX * scale;
    offsetY = mouseY - wheelY * scale;
    drawGrid();
});

document.getElementById('buy-btn').addEventListener('click', () => {
    if (currentX === null || currentY === null) return;
    if (boughtPixels.some(p => p.x === currentX && p.y === currentY)) return;

    let userLink = document.getElementById('pixel-link').value.trim();
    if (userLink && !/^https?:\/\//i.test(userLink)) {
        userLink = 'https://' + userLink;
    }

    const blockData = {
        x: currentX, y: currentY,
        color: document.getElementById('pixel-color').value,
        link: userLink || "https://t.me/blum",
        owner: currentTelegramUser // Зберігаємо юзернейм покупця
    };

    boughtPixels.push(blockData);
    localStorage.setItem('local_pixels', JSON.stringify(boughtPixels));

    currentX = null;
    currentY = null;
    document.getElementById('coords').innerText = "Не вибрано";
    document.getElementById('price').innerText = "0";
    document.getElementById('buy-btn').setAttribute('disabled', 'true');
    document.getElementById('buy-btn').classList.remove('active');

    drawGrid();
    updateInterfaceData();

    if (tg) tg.showAlert(`Успішно зарезервовано користувачем @${currentTelegramUser}!`);
});

let chartInstance = null;
function renderChart() {
    const chartCtx = document.getElementById('cryptoChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
            datasets: [{
                label: 'Market Index ($BLP)',
                data: [0.012, 0.015, 0.014, 0.019, 0.021, 0.025, 0.024],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.06)',
                borderWidth: 2,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f1f5f9' } }
            }
        }
    });
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 340;
    canvas.height = window.innerHeight;
    drawGrid();
});

drawGrid();
updateInterfaceData();