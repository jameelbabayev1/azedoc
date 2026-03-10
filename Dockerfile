# AZEDOC v2.0 Production Docker Image
FROM ruby:3.2-slim

LABEL maintainer="AZEDOC Team"
LABEL version="2.0.0"
LABEL description="Clinical AI Platform for Hospitals"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Gemfile for gem installation
COPY Gemfile ./

# Install gems
RUN gem install bundler && bundle install --jobs 4 --retry 3

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

# Run server with bundle exec
CMD ["bundle", "exec", "ruby", "server.rb"]
