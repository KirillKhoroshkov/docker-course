FROM python:3.12-slim

# Указываем рабочую директорию
WORKDIR /app

# Скачиваем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Создаем директорию для фалов и даем прова на запись в нее всем пользователям
RUN mkdir -p /app/data && chmod 777 /app/data

# Копируем приложение
COPY server.py .

CMD ["python", "server.py"]
