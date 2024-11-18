# Use an official Python image as a base
FROM python:3.7

# Set environment variables for Flask and debugging
ENV FLASK_APP=app.py
ENV FLASK_ENV=development
ENV FLASK_RUN_HOST=0.0.0.0 
ENV FLASK_RUN_PORT=8000   

# Install system dependencies (if needed)
RUN apt-get update && apt-get install -y imagemagick libmagickcore-6.q16-3-extra

# Set the working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install Python dependencies directly
RUN pip install --no-cache-dir flask==2.0.3 dataflows pandas-datapackage-reader flask-api gunicorn hypercorn pandas flask-cors

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["flask", "run", "--host=0.0.0.0", "--port=8000"]
