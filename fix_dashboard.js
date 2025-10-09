const fs = require("fs");

// Read the dashboard file
let content = fs.readFileSync("app/dashboard/page.js", "utf8");

// Add the greeting function after the function declaration
content = content.replace(
  "export default function Dashboard() {\n  const [staff, setStaff] = useState(null);",
  `export default function Dashboard() {
  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const [staff, setStaff] = useState(null);`
);

// Update the greeting display
content = content.replace(
  '                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">\n                      Welcome Back\n                    </h1>\n                    <p className="text-slate-600 font-medium">{staff?.name}</p>',
  '                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">\n                      {getTimeBasedGreeting()}, <span className="text-green-600 font-semibold">{staff?.name}</span>! 👋\n                    </h1>'
);

// Write the updated content back
fs.writeFileSync("app/dashboard/page.js", content);

console.log("Dashboard greeting updated successfully!");













