import '../Styles/ComponentStyles/CustomAlert.css';

function CustomAlert({ message, type, onClose }) {
    if (!message) return null;

    return (
        <div className={`custom-alert-overlay ${type}`}>
            <div className="custom-alert-content">
                <div className="custom-alert-icon">
                    {type === 'success' ? '✓' : '✕'}
                </div>
                <div className="custom-alert-message">{message}</div>
                <button className="custom-alert-close" onClick={onClose}>
                    ×
                </button>
            </div>
        </div>
    );
}

export default CustomAlert
