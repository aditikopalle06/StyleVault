const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("fullname").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirm-password").value;

    // Check that passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Check backend password requirement
    if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    name: name,
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Registration failed.");
            return;
        }

        alert("Account created successfully!");

        // Go to Login page
        window.location.href = "../login/login.html";

    } catch (error) {
        console.error("Registration error:", error);

        alert(
            "Unable to connect to the server. " +
            "Please make sure the backend is running."
        );
    }
});