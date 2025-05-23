# server/Dockerfile
FROM node:18-alpine

# Set the working directory in the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy the rest of the source code.
# This copies your 'src' folder, etc.
COPY . .

# --- DEBUGGING STEPS START HERE ---
# Verify source files are present
RUN echo "--- Listing contents of src/ ---"
RUN ls -l src/

# Verify tsconfig.json is present and readable
RUN echo "--- Contents of tsconfig.json ---"
RUN cat tsconfig.json

# Build the project
RUN echo "--- Running npm run build ---"
RUN npm run build

# After build, list contents of the working directory
RUN echo "--- Listing contents of /usr/src/app/ ---"
RUN ls -l /usr/src/app

# After build, list contents of the 'dist' directory
RUN echo "--- Listing contents of /usr/src/app/dist/ ---"
RUN ls -l /usr/src/app/dist/
# --- DEBUGGING STEPS END HERE ---

# Expose the port
EXPOSE 3000

# Start the application.
CMD ["npm", "start"]