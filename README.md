# 💳 HealthcareAPI (Showcase) REST API (Express & PostgreSQL)

This repository contains the source code for a **RESTful API** designed to manage simplified a health clinic.

It serves as a practical project focused on **deepening and showcasing my expertise** in building robust, well-structured backend applications with Node.js.

## ✨ Project Focus & Skill Showcase

This project is dedicated to **refining and demonstrating advanced skills** in backend development, with a strong emphasis on **high code quality**, robust architecture, and effective database design. Specifically, it highlights proficiency in:

*   **Backend Architecture:** Designing the overall structure and organization of the API codebase.
*   **API Design:** Creating clean, intuitive, and RESTful endpoints.
*   **Database Design:** Modeling relationships and querying data efficiently in PostgreSQL.
*   **Secure Authentication:** Implementing user registration and login using **Passport.js** with **JWT (JSON Web Token) and Local strategies**.
*   **Data Security:** Secure password hashing using **bcrypt**.
*   **Data Validation:** Ensuring data integrity through robust input validation (**class-validator** or **express-validator**).
*   **Testing:** Implementing comprehensive unit and integration tests using **Jest** and **Supertest** for endpoint reliability.
*   **Code Quality:** Maintaining high code standards with **ESLint** (linting) and **Prettier** (formatting).
*   **Documentation:** Generating API documentation using **Swagger (OpenAPI)**.

The goal is to build a production-ready structure and write code that is readable, maintainable, and performant.

## 🚀 Features

*   User Registration and Authentication (Login via JWT/local).
*   Endpoints for creating, reading, updating, and deleting (CRUD) simplified transaction records.
*   Input data validation for API requests.
*   Token-based authorization for protected routes.

## 🛠️ Technologies Used

*   **Express.js:** Fast, unopinionated, minimalist web framework for Node.js.
*   **PostgreSQL:** Powerful open-source relational database system.
*   **TypeScript:** Adds static types to JavaScript for improved maintainability and fewer errors.
*   **Passport.js:** Authentication middleware for Node.js.
    *   **passport-jwt:** Passport strategy for authenticating with JSON Web Tokens.
    *   **passport-local:** Passport strategy for authenticating with a username and password.
*   **jsonwebtoken (JWT):** Library for signing and verifying JSON Web Tokens.
*   **bcrypt:** Library for hashing passwords securely.
*   **class-validator / express-validator:** For declarative or chainable data validation.
*   **Swagger / OpenAPI:** For documenting the API endpoints.
*   **Jest:** Delightful JavaScript Testing Framework.
*   **Supertest:** A library for testing HTTP servers, often used with Jest for API integration tests.
*   **ESLint:** Pluggable linting utility for JavaScript and JSX.
*   **Prettier:** An opinionated code formatter.
*   **dotenv:** Loads environment variables from a `.env` file.
