const loginForm = document.getElementById("loginForm");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {

        alert("Please enter your email and password.");

        return;
    }


    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(data.error || "Login failed.");

            return;
        }


        localStorage.setItem("token", data.token);

        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );


        alert("Login successful!");


        window.location.href = "../dashboard/dashboard.html";


    } catch (error) {

        console.error("Login error:", error);

        alert(
            "Unable to connect to the server. " +
            "Please make sure the backend is running."
        );
    }

});


const createAccountButton =
    document.getElementById("createAccountButton");


createAccountButton.addEventListener("click", function () {

    window.location.href = "../register/register.html";

});