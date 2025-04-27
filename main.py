from flask import Flask, request, jsonify # type: ignore
from flask_cors import CORS # type: ignore
from langchain_community.vectorstores import FAISS # type: ignore
from langchain_community.document_loaders import CSVLoader # type: ignore
from langchain.prompts import PromptTemplate # type: ignore
from langchain.chains import RetrievalQA # type: ignore
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI # type: ignore
from flask_sqlalchemy import SQLAlchemy # type: ignore
import os
import csv

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Requests (important for React frontend)
# Configure SQLite Database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///knowledgebase.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Database Model
class Knowledge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), nullable=False)
    answer = db.Column(db.String(1000), nullable=False)

# Create Database
with app.app_context():
    db.create_all()

# Set API Key for Google Gemini AI
os.environ["GOOGLE_API_KEY"] = "AIzaSyD-LD3iA7fWZcKPeNfR9BpdGMshWOgOUq0"

# Initialize Language Model (LLM)
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)

# Initialize Embeddings
instructor_embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Define FAISS Database Path
vectordb_file_path = "faiss_index"

# Function to Create FAISS Vector Database
def create_vector_db():
    """Creates a FAISS vector database from the CSV file."""
    loader = CSVLoader(file_path='dit_faqs_data - Sheet1.csv', source_column="prompt")
    docs = loader.load()
    vectordb = FAISS.from_documents(documents=docs, embedding=instructor_embeddings)
    vectordb.save_local(vectordb_file_path)

# Function to Get QA Chain
def get_qa_chain():
    """Loads FAISS database and sets up QA chain."""
    vectordb = FAISS.load_local(vectordb_file_path, instructor_embeddings, allow_dangerous_deserialization=True)
    retriever = vectordb.as_retriever(score_threshold=0.7)

    prompt_template = """Given the following context and a question, generate an answer based on this context only.
    In the answer try to provide as much text as possible from "response" section in the source document context without making much changes.
    If the answer is not found in the context, kindly state "I don't know. Kindly visit the university official website." Don't try to make up an answer.

    CONTEXT: {context}

    QUESTION: {question}"""

    PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

    chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, input_key="query",
                                        return_source_documents=True, chain_type_kwargs={"prompt": PROMPT})
    return chain

# Predefined FAQ Answers
faq_answers = {
    "What is the fee structure for B.Tech in Computer Science & Engineering?": "For the All India category: 1st Semester: INR 1,71,900, 2nd Semester: INR 1,71,900. For Uttarakhand/Himalayan State Quota: 1st Semester: INR 1,43,913, 2nd Semester: INR 1,43,963.",
    "What is the application process for international students?": "International students need to apply via our online portal.",
    "What are the required documents for admission?": "You need mark sheets, identity proof, and a passport-size photograph.",
    "What is the selection criteria for MBA programs?": "MBA admission is based on entrance exam scores, personal interviews, and academic performance.",
    "What are the deadlines for submitting the application form?": "The application deadline is typically June 30th.",
    "What specialized tracks are available in the Computer Science & Engineering program?": "Tracks include AI, Cybersecurity, and Data Science.",
    "What are the library timings?": "The library is open from 9 AM to 9 PM on weekdays and 10 AM to 6 PM on weekends.",
    "How does the university support student entrepreneurship?": "We have an incubation center, funding programs, and mentorship for startups.",
    "What is the scholarship policy for subsequent years?": "Scholarships are based on academic performance and require maintaining a minimum GPA.",
    "Where is DIT University located?": "DIT University is located in Dehradun, Uttarakhand, India.",
}

# Ensure vector database is created before running
create_vector_db()
qa_chain = get_qa_chain()

# API Route to Handle Questions
@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.json
    user_query = data.get("query")

    if not user_query:
        return jsonify({"error": "Query not provided"}), 400

    # Check if the query matches one of the predefined FAQ questions
    if user_query in faq_answers:
        answer = faq_answers[user_query]
    else:
        # Process the query using LangChain QA Chain if it's not an FAQ
        response = qa_chain.invoke({"query": user_query})
        answer = response["result"]

    return jsonify({"answer": answer})
CSV_FILE_PATH = "dit_faqs_data - Sheet1.csv" 

def load_questions_from_csv():
    questions = []
    try:
        with open(CSV_FILE_PATH, newline='', encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if len(row) == 2:  # Ensure valid question-answer pairs
                    questions.append({"question": row[0], "answer": row[1]})
    except FileNotFoundError:
        return []  # Return an empty list if the file doesn't exist
    return questions

# New endpoint to return all questions and answers for the admin
@app.route('/admin/questions', methods=['GET'])
def get_all_questions():
    # This endpoint is protected and only accessible by admins.
    # Admin authentication check can be added here.
    admin_credentials = {
        "Amitesh@67": "Amitesh@67",
        "Arkam@18": "Arkam@18",
        "kashif@12": "kashif@23"
    }
    
    # Simple check for admin authentication
    auth = request.headers.get('Authorization')
    if not auth or auth not in admin_credentials:
        return jsonify({"error": "Unauthorized access"}), 403
    
    questions = load_questions_from_csv()
    return jsonify(questions)

# API to add a question
@app.route('/add_question', methods=['POST'])
def add_question():
    data = request.json
    new_entry = Knowledge(question=data["question"], answer=data["answer"])
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Question added successfully!"}), 200

# API to fetch latest 6 questions
@app.route('/get_questions', methods=['GET'])
def get_questions():
    questions = Knowledge.query.order_by(Knowledge.id.desc()).limit(6).all()
    return jsonify([{"question": q.question, "answer": q.answer} for q in questions]), 200

CSV_FILE_PATH = "dit_faqs_data - Sheet1.csv" 

# Route to save the question-answer pair


CSV_FILE_PATH = "dit_faqs_data - Sheet1.csv"
# Ensure CSV file has headers if it doesn't exist
if not os.path.exists(CSV_FILE_PATH):
    with open(CSV_FILE_PATH, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Question", "Answer"])  # ✅ Add column headers

@app.route("/save-question", methods=["POST"])
def save_question():
    try:
        data = request.get_json()

        # Debugging: Print received data
        print("Received data:", data)

        # Validate input data
        if not data or "question" not in data or "answer" not in data:
            return jsonify({"error": "Invalid data format"}), 400  # Bad Request

        question = data["question"].strip()  # Remove extra spaces
        answer = data["answer"].strip()

        # Save to CSV (handle commas by using `quotechar='"'`)
        with open(CSV_FILE_PATH, "a", newline="") as file:
            writer = csv.writer(file)  # ✅ Ensures proper CSV formatting
            writer.writerow([question, f'"{answer}"'])  # ✅ Properly stores in two columns

            # Rebuild the vector database 🔁
        create_vector_db()

        global qa_chain
        qa_chain = get_qa_chain()  # Refresh the chain with the updated DB

        return jsonify({"message": "Question saved successfully!"}), 200

    except Exception as e:
        print("Error:", str(e))  # Log error in terminal
        return jsonify({"error": "Internal Server Error"}), 500  # Server error
    
@app.route("/update-question", methods=["PUT"])
def update_question():
    try:
        data = request.get_json()

        old_question = data.get("old_question")
        new_question = data.get("question")
        new_answer = data.get("answer")

        if not old_question or not new_question or not new_answer:
            return jsonify({"error": "Missing required fields"}), 400

        updated_rows = []
        found = False

        # Read existing data and update
        with open(CSV_FILE_PATH, newline='', encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            for row in reader:
                if len(row) != 2:
                    continue
                question, answer = row
                if question.strip() == old_question.strip():
                    updated_rows.append([new_question.strip(), new_answer.strip()])
                    found = True
                else:
                    updated_rows.append([question, answer])

        if not found:
            return jsonify({"error": "Question not found"}), 404

        # Rewrite CSV with updated content
        with open(CSV_FILE_PATH, "w", newline='', encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(updated_rows)

        # Rebuild FAISS vector DB
        create_vector_db()
        global qa_chain
        qa_chain = get_qa_chain()

        return jsonify({"message": "Question updated successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Internal Server Error"}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=True)


