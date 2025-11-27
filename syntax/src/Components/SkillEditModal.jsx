import { useState } from "react";
import { Code, Target, X, Plus } from "lucide-react";
import styles from "../Styles/ComponentStyles/SkillEditModal.module.css";

export default function SkillEditModal({
  initialLanguages,
  initialSkills,
  onSave,
  onClose,
}) {
  const [languages, setLanguages] = useState(initialLanguages || []);
  const [skills, setSkills] = useState(initialSkills || []);
  const [isLoading, setIsLoading] = useState(false);

  const [newLanguage, setNewLanguage] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);

  // Add language
  const handleAddLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  // Remove language
  const handleRemoveLanguage = (lang) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  // Add skill
  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      setSkills([
        ...skills,
        { skill: newSkillName.trim(), level: newSkillLevel },
      ]);
      setNewSkillName("");
      setNewSkillLevel(50);
    }
  };

  // Remove skill
  const handleRemoveSkill = (skillName) => {
    setSkills(skills.filter((s) => s.skill !== skillName));
  };

  // Save changes
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({ languages, skills });
    } catch (error) {
      console.error("Error saving skills:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key for inputs
  const handleLanguageKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddLanguage();
    }
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddSkill();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Languages & Skills</h2>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Languages Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Code size={20} />
              Programming Languages
            </h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyPress={handleLanguageKeyPress}
                placeholder="Enter a programming language"
                className={styles.input}
              />
              <button
                onClick={handleAddLanguage}
                className={styles.addButton}
                disabled={!newLanguage.trim()}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className={styles.itemsContainer}>
              {languages.length > 0 ? (
                languages.map((lang) => (
                  <span key={lang} className={styles.languageTag}>
                    {lang}
                    <button
                      onClick={() => handleRemoveLanguage(lang)}
                      className={styles.removeButton}
                      title="Remove language"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateText}>
                    No languages added yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Target size={20} />
              Skills & Proficiency
            </h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                placeholder="Skill name (e.g., Arrays, Trees)"
                className={styles.input}
              />
              <input
                type="number"
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                min="0"
                max="100"
                className={`${styles.input} ${styles.levelInput}`}
                title="Proficiency level (0-100%)"
              />
              <button
                onClick={handleAddSkill}
                className={styles.addButton}
                disabled={!newSkillName.trim()}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className={styles.skillsList}>
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <div key={skill.skill} className={styles.skillItem}>
                    <div className={styles.skillInfo}>
                      <span className={styles.skillName}>{skill.skill}</span>
                      <span className={styles.skillLevel}>{skill.level}%</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill.skill)}
                      className={styles.skillRemoveButton}
                      title="Remove skill"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyStateText}>No skills added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>
    </div>
  );
}
