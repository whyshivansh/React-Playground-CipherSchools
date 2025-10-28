import { useState, useEffect } from "react";
import axios from 'axios';
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview, SandpackFileExplorer } from "@codesandbox/sandpack-react";

// Helper converters: object <-> array (safe for MongoDB)
const filesObjectToArray = (filesObj) =>
  Object.entries(filesObj).map(([path, meta]) => ({
    path,
    ...(typeof meta === "string" ? { code: meta } : meta || {}),
  }));

const filesArrayToObject = (filesArr) =>
  (filesArr || []).reduce((acc, { path, ...rest }) => {
    if (path) acc[path] = { ...rest };
    return acc;
  }, {});

// Default files for a new project
const initialFiles = {
  "/src/styles.css": { // Renamed from index.css to avoid confusion
    code: `
body {
  font-family: sans-serif;
  -webkit-font-smoothing: auto;
  -moz-font-smoothing: auto;
  -moz-osx-font-smoothing: grayscale;
  font-smoothing: auto;
  text-rendering: optimizeLegibility;
  font-smooth: always;
}
h1 {
  font-size: 1.5rem;
  color: #2c3e50;
}`,
  },
  "/src/App.js": {
    code: `
import "./styles.css"; // Correctly import the renamed css file

export default function App() {
  return <h1>Hello CipherStudio!</h1>;
}`,
  },
  "/src/index.js": {
    code: `
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js"; 

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    hidden: true,
  },
};

export default function Ide({ user, onLogout }) {
  // State for Sandpack files
  const [files, setFiles] = useState(initialFiles);
  // State for the list of projects in the dropdown
  const [projectList, setProjectList] = useState([]);
  // State for the currently active/loaded project
  const [activeProject, setActiveProject] = useState(null);
  // State for user feedback
  const [status, setStatus] = useState("Ready");

  // --- FIX 1: ADD STATE TO TRACK ACTIVE FILE ---
  const [currentActiveFile, setCurrentActiveFile] = useState("/src/App.js");


  // Fetch all user projects on component load
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setStatus("Loading projects...");
        const { data } = await axios.get('http://localhost:5000/api/projects');
        setProjectList(data);
        setStatus("Ready");
      } catch (error) {
        console.error("Error fetching projects:", error);
        setStatus("Could not load projects.");
      }
    };
    fetchProjects();
  }, []); // Runs once on mount

  // --- PROJECT MANAGEMENT HANDLERS ---

  const handleNewProject = async () => {
    const projectName = prompt("Enter new project name:");
    if (!projectName) return;
    try {
      setStatus(`Creating ${projectName}...`);
      // SAVE AS ARRAY (Mongo-safe)
      const newProjectPayload = { name: projectName, files: filesObjectToArray(initialFiles) };
      const { data: newProject } = await axios.post('http://localhost:5000/api/projects', newProjectPayload);
      setProjectList([...projectList, newProject]);
      setActiveProject(newProject);
      // LOAD BACK TO OBJECT FOR SANDPACK
      setFiles(Array.isArray(newProject.files) ? filesArrayToObject(newProject.files) : newProject.files);
      setCurrentActiveFile("/src/App.js");
      setStatus(`Project "${newProject.name}" created!`);
    } catch (error) {
      console.error("Error creating project:", error);
      setStatus("Error creating project.");
    }
  };

  const handleLoadProject = async (projectId) => {
    if (!projectId) {
      setActiveProject(null);
      setFiles(initialFiles);
      setCurrentActiveFile("/src/App.js");
      setStatus("Ready");
      return;
    }
    try {
      setStatus("Loading project...");
      const { data: projectToLoad } = await axios.get(`http://localhost:5000/api/projects/${projectId}`);
      setActiveProject(projectToLoad);
      // SUPPORT BOTH ARRAY AND OBJECT FROM API
      const loadedFiles = Array.isArray(projectToLoad.files) ? filesArrayToObject(projectToLoad.files) : projectToLoad.files;
      setFiles(loadedFiles);
      const newActiveFile = Object.keys(loadedFiles).find(k => !loadedFiles[k].hidden && !k.endsWith('/')) || "/src/App.js";
      setCurrentActiveFile(newActiveFile);
      setStatus(`Project "${projectToLoad.name}" loaded!`);
    } catch (error) {
      console.error("Error loading project:", error);
      setStatus("Error loading project.");
    }
  };

  const handleSaveProject = async () => {
    if (!activeProject) {
      alert("Please create or load a project before saving.");
      return;
    }
    try {
      setStatus("Saving project...");
      // SEND AS ARRAY (Mongo-safe)
      const payload = { name: activeProject.name, files: filesObjectToArray(files) };
      const { data: updatedProject } = await axios.put(`http://localhost:5000/api/projects/${activeProject._id}`, payload);
      setStatus(`Project "${updatedProject.name}" saved!`);
      setActiveProject(updatedProject);
      setProjectList(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
    } catch (error) {
      console.error("Error saving project:", error);
      setStatus("Error saving project.");
    }
  };

  // --- FILE MANAGEMENT HANDLERS (Local State) ---

  const handleAddFile = () => {
    const userInput = prompt("Enter new file name/path inside /src (e.g., Button.js or components/Button.js):");
    if (!userInput) return;
    let path = userInput.trim();
    if (path.startsWith('/')) path = path.substring(1);
    if (!path.startsWith('src/')) path = `src/${path}`;
    const formattedPath = `/${path}`;
    if (formattedPath.endsWith('/')) {
      alert("File names cannot end with a '/'. Use 'New Folder' to create a directory.");
      return;
    }
    setFiles(currentFiles => ({
      ...currentFiles,
      [formattedPath]: { code: `// New file: ${formattedPath}\n` },
    }));
    // --- FIX: Set the new file as active ---
    setCurrentActiveFile(formattedPath);
  };

  const handleAddFolder = () => {
    const userInput = prompt("Enter new folder name/path inside /src (e.g., components or store/actions):");
    if (!userInput || userInput.trim() === "") return;
    let path = userInput.trim();
    if (path.startsWith('/')) path = path.substring(1);
    if (path.endsWith('/')) path = path.slice(0, -1);
    if (path === 'src' || path === '') {
      alert("Cannot create an empty folder or 'src' itself.");
      return;
    }
    if (!path.startsWith('src/')) path = `src/${path}`;
    const formattedPath = `/${path}/`;
    setFiles(currentFiles => ({
      ...currentFiles,
      [formattedPath]: { code: "" },
    }));
  };

  const handleDeleteFile = () => {
    const filePathToDelete = prompt("Enter the full path of the file to delete (e.g., /src/Button.js):");
    if (!filePathToDelete) return;

    setFiles(currentFiles => {
       // Check inside the updater function using the guaranteed fresh state
      if (!currentFiles[filePathToDelete]) {
        alert(`File not found: ${filePathToDelete}`);
        return currentFiles; // Return unchanged state
      }
      if (filePathToDelete === "/src/App.js" || filePathToDelete === "/src/index.js") {
        alert("Cannot delete the main entry files.");
        return currentFiles; // Return unchanged state
      }

      const newFiles = { ...currentFiles };
      delete newFiles[filePathToDelete];
      // --- FIX: Reset active file if deleted ---
      if (currentActiveFile === filePathToDelete) {
        // Find the first visible file to set as active
        const nextActiveFile = Object.keys(newFiles).find(key => !newFiles[key].hidden && !key.endsWith('/')) || "/src/App.js";
        setCurrentActiveFile(nextActiveFile);
      }
      return newFiles;
    });
  };

  const handleRenameFile = () => {
    const oldPath = prompt("Enter the full path of the file to rename:");
    if (!oldPath) return;

    setFiles(currentFiles => {
      if (!currentFiles[oldPath]) {
        alert("File not found or operation cancelled.");
        return currentFiles; // Return unchanged state
      }

      const newPath = prompt(`Enter the new path for ${oldPath}:`);
      if (!newPath) return currentFiles; // Return unchanged state if cancelled

      const newFiles = { ...currentFiles };
      const fileContent = newFiles[oldPath];
      delete newFiles[oldPath];
      newFiles[newPath] = fileContent;
      // --- FIX: Update active file if renamed ---
      if (currentActiveFile === oldPath) {
        setCurrentActiveFile(newPath);
      }
      return newFiles;
    });
  };

  // Helper component for SVG icons (keep your existing one)
  const Icon = ({ path }) => (
    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );

  // Icon paths (keep your existing ones)
  const ICONS = {
    newProject: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></>,
    newFile: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></>,
    newFolder: <><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path><line x1="12" y1="10" x2="12" y2="16"></line><line x1="9" y1="13" x2="15" y2="13"></line></>,
    rename: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    delete: <><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></>
  };

  return (
    // Keep your main container structure and classes
    <div className="ide-container"> 

      {/* Keep your toolbar structure and classes */}
      <div className="ide-toolbar flex flex-wrap items-center justify-between p-2 bg-white border-b border-gray-300 gap-y-2">
         {/* ... Your toolbar buttons ... */}
         {/* Project Management Section (keep as is) */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors" onClick={handleNewProject}>
            <Icon path={ICONS.newProject} /> New Project
          </button>
          <select
            className="px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleLoadProject(e.target.value)}
            value={activeProject ? activeProject._id : ""}
          >
            <option value="">My Projects</option>
            {projectList.map(project => (
              <option key={project._id} value={project._id}>{project.name}</option>
            ))}
          </select>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveProject}
            disabled={!activeProject}
          >
            <Icon path={ICONS.save} /> Save Project
          </button>
        </div>
        {/* File Management Section (keep as is) */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAddFile} disabled={!activeProject}>
            <Icon path={ICONS.newFile} /> File
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleAddFolder} disabled={!activeProject}>
           <Icon path={ICONS.newFolder} /> Folder
          </button>
          <button className="p-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleRenameFile} disabled={!activeProject} title="Rename">
            <Icon path={ICONS.rename} />
          </button>
          <button className="p-1.5 border border-gray-300 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDeleteFile} disabled={!activeProject} title="Delete">
            <Icon path={ICONS.delete} />
          </button>
        </div>
        {/* User / Status Section (keep as is) */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-gray-500 italic hidden md:inline">Status: {status}</span>
          <span className="text-sm font-semibold text-gray-700 hidden sm:inline">Welcome, {user.firstName}!</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors" onClick={onLogout}>
            <Icon path={ICONS.logout} /> Logout
          </button>
        </div>
      </div>

      {/* Keep your wrapper for Sandpack */}
     <div className="sandpack-wrapper"> 
        <SandpackProvider
          key={activeProject ? activeProject._id : 'new'}
          files={files}
          template="react" // Keep template="react" if it works for you
          theme="light" // Keep this for styling

          // --- FIX 2: UPDATE SANDPACK WHEN ACTIVE FILE CHANGES ---
          onActiveFileChange={(newPath) => {
            if (newPath) { // Ensure newPath is defined
              setCurrentActiveFile(newPath);
            }
          }}

          customSetup={{
              entry: "/src/index.js",
              dependencies: {
                  "react": "18.2.0",
                  "react-dom": "18.2.0",
                  "react-scripts": "5.0.1"
              }
          }}
          options={{
              // --- FIX 3: MAKE activeFile DYNAMIC ---
              activeFile: currentActiveFile, 
              showTabs: true,
              closableTabs: true,
              // editorWidthPercentage: 60, // Optional: Keep if you want 60/40 split
          }}
        >
          {/* Keep your layout and components */}
          <SandpackLayout>
            <SandpackFileExplorer style={{ height: '100%' }} />
            <SandpackCodeEditor 
              wrapContent={true}
              showLineNumbers
              showTabs
              style={{ height: '100%', flex: 1 }}

              // Replace onCodeChange with the correct onChange signature
              onChange={(newCode, path) => {
                setFiles(currentFiles => {
                  const targetPath = path || currentActiveFile || "/src/App.js";
                  if (!currentFiles[targetPath]) {
                    console.warn("onChange: file not found in state:", targetPath);
                    return currentFiles;
                  }
                  return {
                    ...currentFiles,
                    [targetPath]: {
                      ...currentFiles[targetPath],
                      code: newCode,
                    },
                  };
                });
                if (path && path !== currentActiveFile) {
                  setCurrentActiveFile(path);
                }
              }}
            />
            <SandpackPreview 
              showOpenInCodeSandbox={false}
              showRefreshButton={true}
              style={{ height: '100%', flex: 1 }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}

