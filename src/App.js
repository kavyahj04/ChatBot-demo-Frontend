import "./App.css";
import { useEffect, useState, useRef } from "react";

export default function App(){
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [turnId, setTurnId] = useState(1);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const prolificId = urlParams.get('PROLIFIC_PID') || "test_pid_001";
  const sessionId = urlParams.get('SESSION_ID') || "test_session_001";
  const studyId = urlParams.get('STUDY_ID') || "study_001";
  const qrPre = urlParams.get('qr_pre') || "test_qr_001";

  const sessionStarted = useRef(false);

  const changeEvent = async () => {
    if(input.trim() === "" || !chatSessionId) return;

    const userMessage = { sender: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");

    try {
      const response = await fetch("https://chatbot-demo-backend-production.up.railway.app/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: messageToSend,
          client_turn_id: turnId.toString(),
          chat_session_id: chatSessionId,
          qr_pre: qrPre
        })
      });

      const data = await response.json();
      console.log("Response:", data);
      const botMessage = { sender: "bot", text: data.assistant_message };
      setMessages(prev => [...prev, botMessage]);
      setTurnId(prev => prev + 1);
    }
    catch(error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { sender: "error", text: "Error sending message." }]);
    }
  }

const handleEndChat = () => {
  const pid = prolificId;
  const sid = sessionId;
  window.location.href = `https://binghamton.qualtrics.com/jfe/form/SV_a4v7DcbzU6gc0Ga?PROLIFIC_PID=${pid}&SESSION_ID=${sid}&chat_session_id=${chatSessionId}`;
}
  

  useEffect(() => {

    if (sessionStarted.current) return;
    sessionStarted.current = true;

    const startSession = async () => {
      try {
        const response = await fetch("https://chatbot-demo-backend-production.up.railway.app/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pid: "111111111",
            study_id: studyId,
            prolific_session_id: sessionId,
            qr_pre: qrPre,
            experiment_id: "exp_001"
          })
        });

        const data = await response.json();
        console.log("Session started:", data);
        setChatSessionId(data.chat_session_id);
      } catch (error) {
        console.error("Failed to start session:", error);
      } finally {
        setLoading(false);
      }
    };

    startSession();
  }, [])

  return(
    <div className="app">
      <div className="main">
        <div className="chat-header">
          <h3>Research Chat</h3>
          <button className="end-chat-btn" onClick={handleEndChat}>
            Continue to Post-Survey
          </button>
        </div>

        <div className="chat-box">
          {messages.length === 0 && (
            <div className="empty-state">
              <h2>{loading ? "Initializing session..." : "How can I help you today?"}</h2>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              <div className="avatar">
                {message.sender === "user" ? "👤" : "🤖"}
              </div>
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder={loading ? "Initializing..." : "Message chatbot..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') changeEvent(); }}
            disabled={loading || !chatSessionId}
          />
          <button disabled={!input.trim() || !chatSessionId || loading} onClick={changeEvent}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}