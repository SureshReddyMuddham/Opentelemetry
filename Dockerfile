# Use an official Node.js runtime as the base image
FROM node:23.2.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port your app runs on
EXPOSE 5001

# Command to run the application, load tracing.js before server.js
CMD ["node", "-r", "tracing.js", "server.js"]
