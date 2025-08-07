# syntax=docker/dockerfile:1

# Stage 1: Build the React application
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build the application. Ensure VITE_MAPBOX_TOKEN is available if needed.
# If using build arguments in docker-compose.yml:
# ARG VITE_MAPBOX_TOKEN
# ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx content
RUN rm -rf ./*

# Copy built assets from the builder stage
COPY --from=builder /app/dist .

# Configure Nginx to serve the application and proxy API requests
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
