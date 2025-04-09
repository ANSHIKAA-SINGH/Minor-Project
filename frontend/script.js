// Toggle between Register and Login Forms
function showForm(form) {
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginForm').classList.add('hidden');

  document
    .querySelectorAll('.tab-btn')
    .forEach((btn) => btn.classList.remove('active'));

  if (form === 'register') {
    document.getElementById('registerForm').classList.remove('hidden');
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
  } else {
    document.getElementById('loginForm').classList.remove('hidden');
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
  }
}

//register
document
  .getElementById('registerForm')
  .addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      console.log('Server Response:', response.status, result); // 🔍 Debugging log

      if (response.ok) {
        alert(result.message);
        window.location.href = 'circuit.html';
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('Error: Unable to register. Please try again.');
    }
  });

// Login User
// Login User
document
  .getElementById('loginForm')
  .addEventListener('submit', async function (event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      window.location.href = 'circuit.html'; // Redirect on success
    } else {
      alert(result.message);
    }
  });
