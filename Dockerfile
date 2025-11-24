FROM node:20-slim

# Install dependencies and build the frontend
WORKDIR /app
COPY backend ./backend
RUN cd backend \
  && npm ci \
  && npm run frontend:build

# Run the Node server (serves API + built frontend)
WORKDIR /app/backend
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "run", "dev"]
