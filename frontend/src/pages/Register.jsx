import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Developer",
    organization: "Engineering Core",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      addToast("Please fill in all required fields.", "warning");
      return;
    }

    setLoading(true);
    try {
      if (register) {
        await register(formData);
      }
      addToast("Registration successful! Welcome to CodeAware AI.", "success");
      navigate("/");
    } catch (err) {
      addToast(err.message || "Registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "440px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Layers size={24} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
            Create Account
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            Join your team on CodeAware Local-First AI
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="input-label">Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              <input
                type="text"
                className="input-field"
                placeholder="Sarah Chen"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ paddingLeft: "38px" }}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Work Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              <input
                type="email"
                className="input-field"
                placeholder="sarah.chen@codeaware.ai"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ paddingLeft: "38px" }}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ paddingLeft: "38px" }}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Engineering Role</label>
            <select
              className="input-field"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Developer">Developer</option>
              <option value="Security Architect">Security Architect</option>
              <option value="Lead Engineer">Lead Engineer</option>
              <option value="DevOps Specialist">DevOps Specialist</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: "8px", padding: "10px" }}
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight size={15} style={{ marginLeft: "6px" }} />
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "12.5px", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
