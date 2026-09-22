import React from 'react';
import { useFlash } from '../../context/FlashContext';

export default function FlashMessage() {
  const { flash, clearFlash } = useFlash();

  if (!flash) return null;

  const isSuccess = flash.type === 'success';

  return (
    <div className="cover" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <div
        className="alert flash-banner"
        role="alert"
        style={{
          background: isSuccess ? '#d1fae5' : '#fee2e2',
          color: isSuccess ? '#065f46' : '#991b1b',
          padding: '1rem 1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '.8rem',
          borderRadius: '12px',
        }}
      >
        <i
          className={isSuccess ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}
          style={{ fontSize: '1.2rem' }}
        ></i>
        <span style={{ flex: 1, fontWeight: 500 }}>{flash.message}</span>
        <button
          type="button"
          onClick={clearFlash}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isSuccess ? '#065f46' : '#991b1b',
            fontSize: '1.2rem',
          }}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
