import threading
import uvicorn
import asyncio
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# --- НАЛАШТУВАННЯ ---
TOKEN = "8974383841:AAF7YfnmTsAT_piwpAD7NXwmokv0mzpzeB4"
bot = Bot(token=TOKEN)
dp = Dispatcher()
app = FastAPI()

# --- ВЕБ-ЧАСТИНА ---
# Монтуємо статику, щоб CSS/JS працювали (шукає в поточній папці)
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
async def root():
    return FileResponse("index.html") # Повертає твій HTML файл

def start_web():
    # Використовуємо PORT з Render, якщо він є
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

# --- БОТ-ЧАСТИНА ---
@dp.message(Command("start"))
async def start(message: types.Message):
    await message.answer("Привіт! Натисни /web, щоб відкрити мапу.")

@dp.message(Command("web"))
async def web(message: types.Message):
    markup = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Відкрити мапу",
            web_app=WebAppInfo(url="https://blum-map.onrender.com") # Вкажи свій домен
        )]
    ])
    await message.answer("Натисни кнопку нижче:", reply_markup=markup)

async def start_bot():
    await dp.start_polling(bot)

# --- ЗАПУСК ---
if __name__ == "__main__":
    # Запускаємо сайт у фоні
    threading.Thread(target=start_web, daemon=True).start()
    
    # Запускаємо бота
    asyncio.run(start_bot())
