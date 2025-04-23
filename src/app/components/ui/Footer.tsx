"use client";

import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-greenwhite mt-auto py-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Section supérieure avec logo et informations de contact */}
        <div className="flex flex-col md:flex-col justify-between items-center ">
          {/* Logo et nom */}
          <div className=" mb-2 md:mb-2">
                <div className="flex items-center">
                    <Image
                        src="/images/Logo-MG-transparent.png"
                        alt="MG Conseil Logo"
                        className="w-auto mr-3"
                        width="100"
                        height="100"
                    />
                </div>
            </div>

          {/* Informations de contact */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Téléphone avec bouton d'appel */}
            <a
              href="tel:+33123456789"
              className="flex items-center gap-2 hover:underline transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>06 79 11 27 89</span>
            </a>

            {/* Email */}
            <a
              href="mailto:marion@mg-conseil.pro"
              className="flex items-center gap-2  hover:underline transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>marion@mg-conseil.pro</span>
            </a>
            <div className="flex space-x-4">
              <a
                href="https://linkedin.com/in/mariongerma/"
                target="_blank"
                rel="noopener noreferrer"
                className=" hover:text-blue-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        {/* Section inférieure avec copyright et mentions légales */}
        <div className="pt-6 flex flex-col md:flex-col justify-between items-center">
          <p className=" text-sm mb-2 md:mb-0">
            &copy; {new Date().getFullYear()} MG Conseil. Tous droits réservés.
          </p>
          <div className="flex space-x-4 text-sm">
            <a
              href="/legal/mentions-legales"
              className=" hover:underline transition-colors"
            >
              Mentions Légales
            </a>
            <a
              href="/legal/politique-de-confidentialite"
              className=" hover:underline transition-colors"
            >
              Politique de Confidentialité
            </a>
          </div>
          <span className="text-xs mt-10 flex flex-row">
            Application web conçue et développée par &nbsp;
            <a href="mailto:thibault.corouge@gmail.com"><strong> Thibault Corouge &nbsp;</strong></a>
            en collaboration avec &nbsp;
            <a href="mailto:marion@mg-conseil.pro"><strong> Marion Germa</strong></a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
