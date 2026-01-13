# ZirwaCRM - Small Business Account Management System

A modern desktop application built with Electron and React for managing small business accounts, orders, and expenses.

## Features

- Order Management
  - Create and edit orders with customer details
  - Track order expenses and payments
  - Calculate receivables and profit/loss automatically
  - Search and filter orders

- Expense Tracking
  - Record general business expenses
  - Categorize and track expenses
  - View expense history

- Dashboard
  - Overview of business metrics
  - Total orders, receivables, and expenses
  - Recent orders list
  - Profit/loss tracking

- Vendors
  - Overview of business metrics
  - Total payables
  - Multiple vendors

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the application in development mode:

```bash
npm run dev
```

This will start both the Electron application and the webpack development server.

## Building

To build the application for production:

```bash
npm run build
npm run package
```

The packaged application will be available in the `dist` directory.

## Technologies Used

- Electron
- React
- Tailwind CSS
- Electron Store (for data persistence)

## License

ISC 