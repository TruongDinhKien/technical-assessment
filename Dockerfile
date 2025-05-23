# Use a recent Node.js LTS Alpine image for smaller size
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for 'npm run dev')
RUN npm ci

# Copy the rest of your application code
COPY . .

EXPOSE 5173

# Command to start the development server
# This runs the "dev" script from your package.json
CMD ["npm", "run", "dev"]