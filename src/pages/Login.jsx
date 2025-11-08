import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // تأكدي من المسار الصحيح

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من الحقول
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");

    try {
      // تسجيل الدخول من Firebase
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Logged in successfully");
      navigate("/"); // روح لصفحة الهوم بعد اللوج ان
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError("Failed to log in. Please try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-700">Desk Place</h1>
          <div className="bg-blue-100 p-2 rounded-full my-3">
            <i className="fa-solid fa-right-to-bracket text-blue-900"></i>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-sm text-gray-500">
            Log in to your Desk Place account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-cyan-700 text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition-all duration-700"
          >
            Log In
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a
            onClick={() => navigate("/signup")}
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
