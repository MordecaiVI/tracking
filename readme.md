# Workout Tracker

A personal workout logging web app built with HTML, CSS, JavaScript, and Azure Static Web Apps.  
Includes a serverless backend powered by Azure Functions for storing and retrieving workout data.

## Features

- **Authentication** using Azure Static Web Apps built-in auth (Azure AD, GitHub, Google, etc.).
- **Log workouts** with date, exercise, body part, weight, and reps.
- **Edit** or **delete** workout entries from a dynamic table.
- **Flatpickr** date picker for easy date selection.
- Responsive UI styled with CSS and Font Awesome icons.

## Tech Stack

### Frontend
- HTML, CSS, JavaScript
- [Flatpickr](https://flatpickr.js.org/) for date selection
- [Font Awesome](https://fontawesome.com/) for icons

### Backend
- Azure Static Web Apps built-in **Azure Functions**  
  Functions are located in the `/api` directory:
    - `addWorkout` – Add a new workout
    - `getTable` – Retrieve workouts for the logged-in user
    - `updateWorkout` – Edit an existing workout
    - `deleteWorkout` – Remove a workout

### Hosting
- Hosted on **Azure Static Web Apps**
- Backend deployed automatically with the frontend
- Free plan: includes managed Azure Functions

## Local Development

You can run the app locally using the Azure Static Web Apps CLI:

```bash
npm install -g @azure/static-web-apps-cli
swa start ./ --api-location ./api
