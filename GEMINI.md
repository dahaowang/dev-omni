# Project Overview

DevOmni is a modern, cross-platform desktop toolbox for developers, built using Electron, React, TypeScript, and Tailwind CSS. It offers over 20 commonly used development tools, all processed offline for data security. Key features include "Smart Paste" (which automatically analyzes clipboard content and navigates to the relevant tool), multiple themes, and a VS Code-style editor.

The application's core functionality is implemented in React components, managed by the main `App.tsx` file, and powered by an Electron shell defined in `main.js`. The project uses Vite as its build tool for the React frontend.

## Technologies Used

*   **Core**: Electron, React 18, TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Key Libraries**: `jsonrepair`, `js-yaml`, `cron-parser`, `qrcode`, `jsqr`

## Building and Running

### Prerequisites

Ensure Node.js (v18+ recommended) is installed on your local machine.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/devomni-tools.git
    cd devomni-tools
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Development Mode

To start the Vite development server and the Electron window concurrently:

```bash
npm run electron:dev
```

### Production Build

To build the application for production (output typically in `release/` or `dist/`):

```bash
npm run build
```

## Development Conventions

### Project Structure

The project follows a component-based architecture within the `src/` directory:

*   `components/`: Contains UI components, further organized into `common/` (general UI), `modals/` (modal dialogs), and `tools/` (individual tool implementations).
*   `context/`: Manages React Context for themes and global settings.
*   `utils/`: Houses utility functions, such as clipboard detection logic.
*   `App.tsx`: The main React application entry point.
*   `main.js`: The Electron main process entry point.
*   `index.css`: Global styles and Tailwind CSS configuration.

### Styling

Tailwind CSS is used for styling, allowing for rapid UI development and consistent design.

### TypeScript Usage

The project is written in TypeScript, ensuring type safety and improved code maintainability. `tsconfig.json` defines the compiler options for the project.

### Smart Paste

A core development convention is the "Smart Paste" feature, implemented via `analyzeClipboard` in `utils/clipboardDetection.ts` and integrated into `App.tsx`. This feature automatically detects content types in the clipboard and directs the user to the appropriate tool.

## License

This project is released under the MIT License.