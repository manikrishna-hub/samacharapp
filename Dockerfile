# 🐍 Use lightweight Python 3.13 image
FROM python:3.13-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies for PostgreSQL and building Python packages
RUN apt-get update && apt-get install -y libpq-dev gcc

# Copy your Django project files into the container
COPY . /app

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose Django's port
EXPOSE 8000

# Run Daphne ASGI server for Channels
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "MyApp.asgi:application"]
