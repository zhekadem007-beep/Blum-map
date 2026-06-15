import threading
import uvicorn
import asyncio
from fastapi import FastAPI
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

@dp.message(Command("web"))
async def web(message: types.Message):
    # Створюємо кнопку, яка відкриває твій сайт
    markup = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Відкрити мапу",
            web_app=WebAppInfo(url="https://твій-сайт.onrender.com")
        )]
    ])
    await message.answer("Натисни кнопку нижче, щоб відкрити мапу:", reply_markup=markup)

# --- НАЛАШТУВАННЯ ---
TOKEN = "8974383841:AAF7YfnmTsAT_piwpAD7NXwmokv0mzpzeB4"
bot = Bot(token=TOKEN)
dp = Dispatcher()
app = FastAPI()


# --- ВЕБ-ЧАСТИНА (САЙТ) ---
@app.get("/")
async def root():
    return {"message": "Бот працює, сайт теж!"}


def start_web():
    uvicorn.run(app, host="0.0.0.0", port=8000)


# --- БОТ-ЧАСТИНА ---
@dp.message(Command("start"))
async def start(message: types.Message):
    await message.answer("Привіт! Я працюю разом із веб-додатком.")


async def start_bot():
    await dp.start_polling(bot)


# --- ЗАПУСК ---
if __name__ == "__main__":
    # Запускаємо сайт у фоні
    threading.Thread(target=start_web, daemon=True).start()

    # Запускаємо бота в основному потоці
    asyncio.run(start_bot())