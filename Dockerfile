# AZEDOC v2.0 Production Docker Image
FROM ruby:3.2-slim

LABEL maintainer="AZEDOC Team"
LABEL version="2.0.0"
LABEL description="Clinical AI Platform for Hospitals"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install webrick gem (required for Ruby 3.2)
RUN gem install webrick -v '~> 1.8' --no-document

# Copy application files
COPY server.rb .
COPY public/ ./public/
COPY .env.example .

# Create logs directory
RUN mkdir -p logs && chmod 755 logs

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4200/api/health || exit 1

# Run server
CMD ["ruby", "server.rb"]
