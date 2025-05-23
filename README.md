# Feedback Application

A full-stack application for collecting and managing user feedback, featuring a React frontend, Node.js backend, and PostgreSQL database.

## Features

* **Comprehensive Feedback Management:** Upload CSV files to populate feedback data, view, and search existing feedback.
* **React Frontend:** Modern user interface built with React.
* **Node.js Backend:** Robust API for handling feedback data and interactions.
* **PostgreSQL Database:** Reliable and scalable data storage for all feedback entries.
* **Dockerized Deployment:** Easy setup and deployment using Docker and Docker Compose.
* **Pagination & Search:** Efficiently browse and find specific feedback entries.
* **Persistent Data:** Database data persists across container restarts using Docker volumes.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed:

* [Docker](https://www.docker.com/get-started) (includes Docker Compose)
* [Node.js](https://nodejs.org/en/download/) (LTS recommended, for local development/npm commands)
* [npm](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/TruongDinhKien/technical-assessment.git
    cd technical-assessments
    ```

2.  **Create a `.env` file:**
    In the root of your project directory, create a file named `.env` and add the following content. This will configure your database connection.
    Example
    ```dotenv
    # .env
    DB_NAME=feedback_app
    DB_USER=user
    DB_PASSWORD=password
    ```

    *You can customize these values, but ensure they match your needs and are kept secure in production environments.*

### Running the Application (Recommended: Docker Compose)

The easiest way to get the entire application (database, backend, and frontend) running is using Docker Compose.

1.  **Build and start the services:**
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    * Build the Docker images for your backend and frontend.
    * Create and start the `feedback_db`, `feedback_backend`, and `feedback_frontend` containers.
    * Initialize the PostgreSQL database.

    Once all services are up and running, you can access the frontend:
    * **Frontend:** `http://localhost:5173`
    * **Backend API:** `http://localhost:3000` (for direct API access, though typically used by the frontend)


### Stopping the Application

To stop and remove the containers:
```bash
docker-compose downs