# Used cars shop

The application functions as a compact online product store, complete with `payment` integration for purchases, `file storage` capabilities, and `email communication` features. This application, built on the traditional `MVC` architecture, has provided valuable insights into its strengths and weaknesses. It has also contributed to a deeper understanding of `Express.js`.

---

# Installing

## Prerequisites

Before you begin, ensure you have Node.js version 18.16.0 or later installed on your machine.

## Getting Started

To get started with the project, you need to install all dependencies:

  ```bash
  npm install
  ```

## Environment Configuration

The repository includes an `.env.example` file. You should create the following environment files:

- `.env`: Default environment for new scripts

You can use the `.env.example` file as a template.

PORT - Integer: Port for running server
MONGODB_URI - String: Connection string to DB
STRIPE_SECRET - String: Secret word for stripe
MAIL_API_KEY - String: API key for mail sender
SESSION_SECRET - String: Secret word for session

## Running the Application

To run the application, use the following commands:

- **Development**:

  ```bash
  npm run start:dev
  ```

- **Production**:

  ```bash
  npm run start
  ```

Once the application is running, you can access it via `http://localhost:8080/`.