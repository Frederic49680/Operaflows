"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logger l'erreur pour diagnostic
    console.error("Error Boundary caught:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Une erreur s'est produite
        </h2>
        <p className="text-gray-700 mb-4">
          Désolé, une erreur inattendue s'est produite. Veuillez réessayer.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mb-4 p-4 bg-gray-100 rounded text-sm">
            <summary className="cursor-pointer font-semibold mb-2">
              Détails de l'erreur (mode développement uniquement)
            </summary>
            <pre className="whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\nStack:\n${error.stack}`}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

