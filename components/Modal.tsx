import React from 'react';
import { colors, shadows, borderRadius, zIndex } from '../styles/theme';

export default function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{
      // Use theme overlay color for modal backdrop
      backgroundColor: colors.background.overlay,
      zIndex: zIndex.modal,
    }}>
      <div className="relative p-6 w-11/12 max-w-lg" style={{
        backgroundColor: colors.background.dialog,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.xl,
        color: colors.onBackground
      }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3"
          aria-label="Close modal"
          style={{
            color: colors.neutral.gray500,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            fontSize: '1.25rem'
          }}
        >
          &#10005;
        </button>
        {children}
      </div>
    </div>
  );
}