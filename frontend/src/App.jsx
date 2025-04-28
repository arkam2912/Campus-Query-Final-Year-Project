import React, { useState, useEffect } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";

import "./App.css";

const App = () => {
  // State for the input question, answers, and toggles
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Track the current FAQ question being clicked
  const [currentFAQ, setCurrentFAQ] = useState(null);
  const [faqAnswers, setFaqAnswers] = useState({}); // To store answers for FAQ questions

  // State to handle the "Create Knowledgebase" page view
  const [isCreatingKnowledgebase, setIsCreatingKnowledgebase] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [knowledgebase, setKnowledgebase] = useState([]);

  // State for Admin login
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [allQuestionsAndAnswers, setAllQuestionsAndAnswers] = useState([]); // To store all questions and answers from backend
  const [showOptions, setShowOptions] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // State to track which page is currently active
  const [activePage, setActivePage] = useState("askQuestion"); // default to Ask a Question page

  const handleAddNew = () => {
    setIsAdding(true); // Show input fields when "Add New" is clicked
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleSaveNewQuestion = async () => {
    if (!newQuestion || !newAnswer) {
      alert("Please enter both question and answer!");
      return;
    }

    const newEntry = { question: newQuestion, answer: newAnswer };

    try {
      const response = await axios.post(
        "https://ditu-campus-query-app.onrender.com/save-question",  // Updated API endpoint for deployment
        newEntry
      );

      if (response.status === 200) {
        setAllQuestionsAndAnswers([...allQuestionsAndAnswers, newEntry]);
        setNewQuestion(""); // Clear input fields
        setNewAnswer("");
        setIsAdding(false); // Hide input fields
      } else {
        alert("Failed to save question.");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      alert("An error occurred while saving.");
    }
  };

  const handleCancelNew = () => {
    setIsAdding(false); // Hide input fields when canceled
  };

  // Toggle FAQ box visibility
  const toggleFAQ = () => {
    setIsFAQOpen(!isFAQOpen);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Fetch stored questions from Flask API
  useEffect(() => {
    fetch("https://ditu-campus-query-app.onrender.com/get_questions") // Updated API endpoint for deployment
      .then((res) => res.json())
      .then((data) => setKnowledgebase(data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, []);

  // Function to handle form submission
  const handleUpdate = () => {
    if (question.trim() === "" || answer.trim() === "") {
      alert("Please enter both question and answer.");
      return;
    }

   const newEntry = { question, answer };

fetch("https://ditu-campus-query-app.onrender.com/add_question", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(newEntry),
})
  .then((res) => res.json())
  .then(() => {
    setKnowledgebase([newEntry, ...knowledgebase].slice(0, 6)); // Keep last 6
    setQuestion("");
    setAnswer("");
    setShowForm(false);
    // Send email using EmailJS
    const emailParams = {
      question: newEntry.question,
      answer: newEntry.answer,
      recipient_email: "yourcampusquery@gmail.com",
    };

    emailjs.send(
      "service_oqyl0oo", //  Service ID
      "template_4bxodu9", //  Template ID
      emailParams,
      "XXIfT7MXWH1GDPaLY" //  Public Key
    );
  })
  .catch((err) => console.error("Error adding question:", err));

// Handle submit for typing a question
const handleSubmit = async () => {
  if (!question) return;
  try {
    const response = await axios.post("https://ditu-campus-query-app.onrender.com/ask", {
      query: question,
    });
    setAnswer(response.data.answer); // Display the answer below the question input
  } catch (error) {
    console.error("There was an error fetching the answer:", error);
  }
};

// Handle Clear functionality to reset both question and answer
const handleClear = () => {
  setQuestion(""); // Clear the question input
  setAnswer(""); // Clear the answer
};

// Handle FAQ question click
const handleFAQClick = async (clickedQuestion) => {
  // Clear previous answer before fetching the new one
  setCurrentFAQ(clickedQuestion);

  // If the answer is already available in the state, use it
  if (faqAnswers[clickedQuestion]) {
    setFaqAnswers((prevAnswers) => ({
      ...prevAnswers,
      [clickedQuestion]: faqAnswers[clickedQuestion],
    }));
  } else {
    try {
      // Fetch answer from the backend
      const response = await axios.post("https://ditu-campus-query-app.onrender.com/ask", {
        query: clickedQuestion,
      });

      // Update the answer for the clicked question
      setFaqAnswers((prevAnswers) => ({
        ...prevAnswers,
        [clickedQuestion]: response.data.answer,
      }));
    } catch (error) {
      console.error("There was an error fetching the FAQ answer:", error);
    }
  }
};

// Handle "Create Knowledgebase" page toggle
const handleCreateKnowledgebase = () => {
  setActivePage("createKnowledgebase");
};

// Handle "Ask Question" page toggle
const handleAskQuestion = () => {
  setActivePage("askQuestion");
};

// Email validation function
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const handleKnowledgebaseSubmit = (e) => {
  e.preventDefault();

    // Validate name and email
if (!fullName) {
  setNameError("Full Name cannot be empty");
  return;
} else {
  setNameError(""); // Clear name error if valid
}

if (!email) {
  setEmailError("Email cannot be empty");
  return;
} else if (!isValidEmail(email)) {
  setEmailError("Please provide a correct email address.(xyz@gmail.com)");
  return;
} else {
  setEmailError(""); // Clear email error if valid
}

// EmailJS parameters
const emailParams = {
  from_name: fullName,
  from_email: email,
  message: `A new knowledge base request has been submitted.\n\nName: ${fullName}\nEmail: ${email}`,
};

// Sending email using EmailJS
emailjs
  .send(
    "service_oqyl0oo", // service ID
    "template_4bxodu9", // template ID
    emailParams,
    "XXIfT7MXWH1GDPaLY" //  public key
  )
  .then(
    (response) => {
      console.log("Email sent successfully!", response);
      alert(`Knowledgebase request submitted for ${fullName} (${email})`);
      setIsSubmitted(true);
      setFullName(""); // Clear form
      setEmail(""); // Clear form
    },
    (error) => {
      console.error("Failed to send email:", error);
      alert("Failed to submit knowledgebase request. Please try again.");
    }
  );

// Handle "Admin" Page with All Questions and Answers
const fetchAllQuestions = async () => {
  try {
    const response = await axios.get(
      "https://ditu-campus-query-app.onrender.com/admin/questions", // Updated URL
      {
        headers: { Authorization: username },
      }
    );

    if (Array.isArray(response.data)) {
      setAllQuestionsAndAnswers(response.data); // Directly store the fetched questions
    } else {
      console.error("Unexpected response format:", response.data);
    }
  } catch (error) {
    console.error("Error fetching all questions and answers:", error);
  }
};

const handleAdminLogin = () => {
  const validUsers = [
    { username: "Amitesh@67", password: "Amitesh@67" },
    { username: "Arkam@18", password: "Arkam@18" },
    { username: "kashif@12", password: "kashif@23" },
  ];

  const user = validUsers.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    setIsAdmin(true);
    setLoginError(""); // Clear any previous errors
    fetchAllQuestions(); // Fetch all questions after login
  } else {
    setLoginError("Invalid username or password");
  }
};

const handleLogout = () => {
  setIsAdmin(false);
  setActivePage("askQuestion"); // Redirect to Ask a Question page after logout
};

return (
  <div className={`container ${isSidebarOpen ? "" : "sidebar-collapsed"}`}>
    {/* Sidebar - Collapsible */}
    <div className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
      {/* Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isSidebarOpen ? "◀" : "▶"}
      </button>

      {/* Sidebar Content */}
      {isSidebarOpen && (
        <>
          <h2 className="nav-title">Navigation</h2>
          <button
            className={`nav-button ${
              activePage === "askQuestion" ? "active" : ""
            }`}
            onClick={handleAskQuestion}
          >
            Ask a Question
          </button>
          <button
            className={`nav-button ${
              activePage === "createKnowledgebase" ? "active" : ""
            }`}
            onClick={handleCreateKnowledgebase}
          >
            Generate responses
          </button>
          <button
            className="nav-button"
            onClick={() => setActivePage("admin")}
          >
            Admin
          </button>
        </>
      )}
    </div>

    {/* Main Content */}
    <div className="main-content">
      <div className="content-wrapper">
        {activePage !== "admin" && (
          <>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/2e/DIT_University_Dehradun_Logo.jpg"
              alt="Logo"
              className="logo"
            />
            <h1 className="title">Campus Queries App</h1>
          </>
        )}


{/* Conditional Rendering Based on Active Page */}
{activePage === "askQuestion" && (
  <>
    {/* Question Box */}
    <div className="question-box">
      <h2 className="box-title">Ask a Question</h2>
      <input
        type="text"
        placeholder="Type your question here..."
        className="input-field"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button className="submit-button" onClick={handleSubmit}>
        Submit
      </button>
      <button className="clear-button" onClick={handleClear}>
        Clear
      </button>

      {/* Displaying Answer Below the Question Box */}
      {answer && (
        <div className="answer-box">
          <h2>Answer:</h2>
          <p>{answer}</p>
        </div>
      )}
    </div>

    {/* FAQ Section */}
    <div className="faq-section">
      <h2 className="faq-title" onClick={toggleFAQ}>
        Frequently Asked Questions {isFAQOpen ? "▲" : "▼"}
      </h2>

      {/* FAQ Box - Collapsible */}
      <div className={`faq-box ${isFAQOpen ? "visible" : "hidden"}`}>
        <ul className="faq-list">
          {/* FAQ Questions - Make them clickable */}
          {[
            "What is the fee structure for B.Tech in Computer Science & Engineering?",
            "What is the application process for international students?",
            "What are the required documents for admission?",
            "What is the selection criteria for MBA programs?",
            "What are the deadlines for submitting the application form?",
            "What specialized tracks are available in the Computer Science & Engineering program?",
            "What are the library timings?",
            "How does the university support student entrepreneurship?",
            "What is the scholarship policy for subsequent years?",
            "Where is DIT University located?",
          ].map((question, index) => (
            <li key={index} className="faq-item">
              <div onClick={() => handleFAQClick(question)}>
                {question}
              </div>
              {/* Displaying FAQ Answer if Available */}
              {currentFAQ === question && faqAnswers[question] && (
                <div className="faq-answer">
                  <h3>Answer:</h3>
                  <p>{faqAnswers[question]}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </>
)}

{/* Create Knowledgebase Page */}
{activePage === "createKnowledgebase" && (
  <div className="create-knowledgebase">
    {/* Go to Main Page Button (Only visible after submission) */}
    {isSubmitted && (
      <button
        className="go-to-main"
        onClick={() => {
          setActivePage("askQuestion");
          setIsSubmitted(false);
          setFullName("");
          setEmail("");
        }}
      >
        Go to Main Page
      </button>
    )}
    {isSubmitted ? (
      <div className="submitted-page">
        <button
          className="add-button"
          onClick={() => setShowForm(!showForm)} // Toggle form visibility
        >
          {showForm ? "Close" : "Add +"}
        </button>

        {/* Show the form only when showForm is true */}
        {showForm ? (
          <div className="new-form">
            <h3>Ask a Question</h3>
            <input
              type="text"
              placeholder="Enter your question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <textarea
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            <button onClick={handleUpdate}>Update</button>
          </div>
        ) : (
          // Show previous questions only when form is closed
          <div className="previous-questions">
            <h3>Previous Questions</h3>
            {knowledgebase.map((item, index) => (
              <div key={index} className="qa-box">
                <p>
                  <strong>Q:</strong> {item.question}
                </p>
                <p>
                  <strong>A:</strong> {item.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    ) : (
      <>
        <h3>Please enter your details to proceed further</h3>
        <input
          type="text"
          placeholder="Enter your Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        {nameError && <p className="error">{nameError}</p>}
        <input
          type="email"
          placeholder=" Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {emailError && (
          <p style={{ color: "red" }} className="error">
            {emailError}
          </p>
        )}
        <button onClick={handleKnowledgebaseSubmit}>Submit</button>
      </>
    )}
  </div>
)}

{/* Admin Login Page */}
{activePage === "admin" && !isAdmin && (
  <div className="admin-login">
    <h2>Admin Login</h2>
    <input
      type="text"
      placeholder="Username"
      onChange={(e) => setUsername(e.target.value)}
    />
    <input
      type="password"
      placeholder="Password"
      onChange={(e) => setPassword(e.target.value)}
    />
    <button onClick={handleAdminLogin}>Login</button>
    {loginError && (
      <p style={{ color: "red" }}>Invalid credentials</p>
    )}
  </div>
)}

{activePage === "admin" && isAdmin && (
  <div className="admin-panel">
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
    <h2>Admin Panel</h2>
    <h3>All Questions and Answers</h3>

    {/* Floating Button and Options */}
    <div className="floating-container">
      {showOptions && (
        <div className="floating-options">
          <button className="option-button" onClick={handleAddNew}>
            Add New
          </button>
          {/* <button className="option-button">Edit</button> */}
        </div>
      )}
      <button
        className="floating-button"
        onClick={() => setShowOptions(!showOptions)}
      >
        +
      </button>
    </div>
  </div>
)}

{/* Display Questions and Answers */}
              <div className="questions-container">
                <ul>
                  {/* Show new question input at the top when adding */}
                  {isAdding && (
                    <div className="new-question-container">
                      <input
                        type="text"
                        placeholder="Enter new question"
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Enter new answer"
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                      />
                      <button onClick={handleSaveNewQuestion}>Save</button>
                      <button onClick={() => setIsAdding(false)}>Cancel</button>
                    </div>
                  )}

                  {Array.isArray(allQuestionsAndAnswers) &&
                  allQuestionsAndAnswers.length > 0 ? (
                    <div className="questions-container">
                      <ul>
                        {allQuestionsAndAnswers.map((item, index) => (
                          <li key={index}>
                            <div className="question">{item.question}</div>
                            <div className="answer">{item.answer}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No questions found.</p> // This will only appear if the list is empty
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
  );

export default App;
