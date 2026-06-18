import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

TOKEN = "8693910802:AAHXMk9rm4i1XsXgVn474fYXcwJGrMpe4Wc"

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(message):
    kb = InlineKeyboardMarkup(row_width=1)

    miniapp_btn = InlineKeyboardButton(
        text="Відкрити Pixel Map",
        web_app=WebAppInfo("https://lucent-tarsier-27cfa8.netlify.app/")
    )

    channel_btn = InlineKeyboardButton(
        text="Telegram канал",
        url="https://t.me/MetrixGrid"
    )

    group_btn = InlineKeyboardButton(
        text="Telegram група",
        url="https://t.me/MetrixGridChat"
    )

    kb.add(miniapp_btn, channel_btn, group_btn)

    text = (
        "<b>Blum Pixel Map</b>\n"
        "Система піксельної карти\n\n"
        "Оберіть дію нижче:"
    )

    bot.send_message(
        message.chat.id,
        text,
        reply_markup=kb,
        parse_mode="HTML"
    )

bot.infinity_polling()
