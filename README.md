# Vancix OS Deployment Instructions

To generate the `dist` file (distribution folder) for deployment:

1.  **Open Terminal** (or Console).
2.  **Install Dependencies**: Run the command:
    ```bash
    npm install
    ```
3.  **Build the Project**: Run the command:
    ```bash
    npm run build
    ```

### What happens next?
*   A new folder named `dist` will appear in your project files.
*   This folder contains the optimized `index.html` and assets.
*   **To Deploy without PC**:
    *   **Option 1 (GitHub/Vercel/Netlify):** Commit this code to GitHub. Connect your GitHub repo to Vercel or Netlify. They will automatically run `npm run build` for you using the settings I provided.
    *   **Option 2 (Manual):** If you can run the build command in your online editor, you can download the `dist` folder and upload it to any web host.
