const fs = require("fs");
const path = require("path");

/**
 * Script to properly update the user dashboard greeting to match admin dashboard format
 * This follows best coding practices:
 * 1. Read file content
 * 2. Make precise replacements
 * 3. Validate changes
 * 4. Write back with proper error handling
 */

function updateDashboardGreeting() {
  try {
    const filePath = path.join(__dirname, "app", "dashboard", "page.js");

    // Read the file content
    let content = fs.readFileSync(filePath, "utf8");

    // Step 1: Add the greeting function after the function declaration
    const functionDeclaration = "export default function Dashboard() {";
    const stateDeclaration = "  const [staff, setStaff] = useState(null);";

    if (
      content.includes(functionDeclaration) &&
      content.includes(stateDeclaration)
    ) {
      const greetingFunction = `export default function Dashboard() {
  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const [staff, setStaff] = useState(null);`;

      content = content.replace(
        `${functionDeclaration}\n${stateDeclaration}`,
        greetingFunction
      );

      console.log("✅ Added greeting function");
    } else {
      throw new Error("Could not find function declaration pattern");
    }

    // Step 2: Update the greeting display to match admin dashboard format
    const oldGreeting = `                  <h1 className="text-3xl font-bold bg-gradient-to-r
from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">       
                    Welcome Back
                  </h1>
                  <p className="text-slate-600 font-medium">{staff?.name}</p>`;

    const newGreeting = `                  <h1 className="text-3xl font-bold bg-gradient-to-r
from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">       
                    {getTimeBasedGreeting()}, <span className="text-green-600 font-semibold">{staff?.name}</span>! 👋
                  </h1>`;

    if (content.includes("Welcome Back")) {
      content = content.replace(oldGreeting, newGreeting);
      console.log("✅ Updated greeting display");
    } else {
      throw new Error("Could not find 'Welcome Back' text");
    }

    // Step 3: Write the updated content back
    fs.writeFileSync(filePath, content, "utf8");

    // Step 4: Validate the changes
    const updatedContent = fs.readFileSync(filePath, "utf8");

    if (
      updatedContent.includes("getTimeBasedGreeting") &&
      updatedContent.includes("Good morning") &&
      updatedContent.includes("text-green-600") &&
      updatedContent.includes("👋") &&
      !updatedContent.includes("Welcome Back")
    ) {
      console.log("✅ Dashboard greeting updated successfully!");
      console.log("✅ Changes validated - all requirements met");
    } else {
      throw new Error("Validation failed - changes not applied correctly");
    }
  } catch (error) {
    console.error("❌ Error updating dashboard:", error.message);
    process.exit(1);
  }
}

// Run the update
updateDashboardGreeting();













