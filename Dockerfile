FROM ubuntu:latest
LABEL authors="howli"

ENTRYPOINT ["top", "-b"]

# Use an official Node runtime as a base image
FROM node:20

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install
RUN npm seed

# Copy the application code to the container
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run your app
CMD ["npm", "start"]
