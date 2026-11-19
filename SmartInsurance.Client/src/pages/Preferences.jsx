import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell, ShieldCheck, Save, Lock, Pencil, X } from "lucide-react";
import api from "../services/api";

export default function Preferences() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: localStorage.getItem("userName") || "",
    email: localStorage.getItem("userEmail") || "",
    phoneNumber: "",
    address: "",
    role: localStorage.getItem("userRole") || "User"
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [settings, setSettings] = useState(() => ({
    claimUpdates: localStorage.getItem("pref_claimUpdates") !== "false",
    paymentUpdates: localStorage.getItem("pref_paymentUpdates") !== "false",
    announcements: localStorage.getItem("pref_announcements") === "true"
  }));

  const [saved, setSaved] = useState(false);

  const loadProfile = async () => {
    try {
      const response = await api.get("/account/profile");
      setProfile({
        fullName: response.data.fullName || "",
        email: response.data.email || "",
        phoneNumber: response.data.phoneNumber || "",
        address: response.data.address || "",
        role: response.data.role || localStorage.getItem("userRole") || "User"
      });
    } catch (error) {
      setProfileMessage(
        `Profile API error (${error.response?.status || "Network"}): ${error.response?.data?.message || error.message || "Unable to load account details."}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateProfileField = (event) => {
    const { name, value } = event.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setProfileMessage("");
  };

  const cancelProfileEdit = async () => {
    setEditingProfile(false);
    setProfileMessage("");
    await loadProfile();
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    try {
      await api.put("/account/profile", {
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        address: profile.address
      });

      localStorage.setItem("userName", profile.fullName);
      setProfileMessage("Profile updated successfully.");
      setEditingProfile(false);
    } catch (error) {
      const data = error.response?.data;
      setProfileMessage(
        data?.errors?.join(", ") ||
        data?.message ||
        "Unable to update profile. Please check your details."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePasswordField = (event) => {
    const { name, value } = event.target;
    setPassword(prev => ({ ...prev, [name]: value }));
    setPasswordMessage("");
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage("");

    if (password.newPassword !== password.confirmPassword) {
      setPasswordMessage("New password and confirmation do not match.");
      return;
    }

    if (password.newPassword.length < 8) {
      setPasswordMessage("New password must contain at least 8 characters.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.post("/account/change-password", {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword
      });

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setPasswordMessage(
        response.data.message || "Password changed successfully. Please log in again."
      );

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        navigate("/login");
      }, 1800);
    } catch (error) {
      const data = error.response?.data;
      setPasswordMessage(
        data?.errors?.join(", ") ||
        data?.message ||
        "Unable to change password. Check your current password and try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const update = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const savePreferences = () => {
    Object.entries(settings).forEach(([key, value]) =>
      localStorage.setItem(`pref_${key}`, String(value))
    );
    setSaved(true);
  };

  const initials = (profile.fullName || "U")
    .split(" ")
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="page-section">
      <div className="page-title-row">
        <div>
          <h1>Settings</h1>
          <p>Manage your account information and preferences.</p>
        </div>
      </div>

      <div className="panel preferences-panel">
        <h3><User size={19} /> Account Information</h3>

        <div className="preferences-profile">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{profile.fullName || "User"}</strong>
            <p>{profile.email || "Email not available"}</p>
            <span>{profile.role}</span>
          </div>
        </div>

        <div className="settings-edit-heading">
          {!editingProfile && (
            <button
              type="button"
              className="primary-button settings-edit-button"
              onClick={() => {
                setProfileMessage("");
                setEditingProfile(true);
              }}
            >
              <Pencil size={15} /> Edit Profile
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading account details...</p>
        ) : (
          <form className="claim-form settings-compact-form" onSubmit={saveProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                name="fullName"
                value={profile.fullName}
                onChange={updateProfileField}
                required
                minLength={2}
                maxLength={150}
                disabled={!editingProfile}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input value={profile.email} disabled />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                name="phoneNumber"
                value={profile.phoneNumber}
                onChange={updateProfileField}
                placeholder="Enter phone number"
                type="tel"
                disabled={!editingProfile}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={profile.address}
                onChange={updateProfileField}
                placeholder="Enter your address"
                maxLength={300}
                rows={2}
                disabled={!editingProfile}
              />
            </div>

            {editingProfile && (
              <div className="settings-edit-actions">
                <button className="primary-button" type="submit" disabled={savingProfile}>
                  <Save size={16} />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="settings-cancel-button"
                  type="button"
                  onClick={cancelProfileEdit}
                  disabled={savingProfile}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            )}

            {profileMessage && (
              <p className="success-message settings-message">{profileMessage}</p>
            )}
          </form>
        )}
      </div>

      <div className="panel preferences-panel">
        <h3><Lock size={19} /> Change Password</h3>

        <form className="claim-form settings-compact-form" onSubmit={changePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={password.currentPassword}
              onChange={updatePasswordField}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={password.newPassword}
              onChange={updatePasswordField}
              required
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={password.confirmPassword}
              onChange={updatePasswordField}
              required
              autoComplete="new-password"
            />
          </div>

          <button className="primary-button" type="submit" disabled={changingPassword}>
            <ShieldCheck size={16} />
            {changingPassword ? "Updating..." : "Change Password"}
          </button>

          {passwordMessage && (
            <p className="success-message settings-message">{passwordMessage}</p>
          )}
        </form>
      </div>

      <div className="panel preferences-panel">
        <h3><Bell size={19} /> Notification Preferences</h3>

        {[
          ["claimUpdates", "Claim status updates", "Receive updates when your claim status changes."],
          ["paymentUpdates", "Payment updates", "Receive notifications about payment activity."],
          ["announcements", "Platform announcements", "Receive general platform announcements."]
        ].map(([key, title, description]) => (
          <div className="preference-row" key={key}>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
            <label className="preference-switch">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={() => update(key)}
              />
              <span />
            </label>
          </div>
        ))}

        <button className="primary-button preferences-save" onClick={savePreferences}>
          <Save size={16} /> Save Preferences
        </button>

        {saved && <p className="success-message">Preferences saved successfully.</p>}
      </div>

      <div className="panel preferences-panel">
        <h3><ShieldCheck size={19} /> Security</h3>
        <p>Your account is protected through InsureFlow authentication and role-based access.</p>
      </div>
    </div>
  );
}
