'use client'

export default function PolitiqueDeConfidentialite() {


    return(
        <div>
            <section className="max-w-3xl mx-auto p-6 bg-greenwhite rounded-2xl shadow-md  mb-20 mt-20">
                <h1 className="text-3xl font-semibold border-b-2  pb-2 mb-6">Politique de confidentialité</h1>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Données collectées</h2>
                <p>Le site collecte et traite les données suivantes :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>
                    Informations d’identification (email, mot de passe) via <strong>Firebase Authentication</strong> pour la gestion des comptes utilisateurs.
                    </li>
                    <li>
                    Données relatives aux articles et utilisateurs enregistrés dans <strong>Firebase Realtime Database</strong>.
                    </li>
                    <li>
                    Statistiques de navigation anonymes via <strong>Plausible Analytics</strong>, outil respectueux de la vie privée ne déposant pas de cookies.
                    </li>
                </ul>
                <p className="mt-2">Aucune donnée personnelle n’est cédée à des tiers sans votre consentement.</p>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Sécurité des données</h2>
                <p>
                    Les données sont hébergées et sécurisées via <strong>Firebase</strong> (Google Cloud Platform).
                    Toutes les mesures nécessaires sont mises en place pour assurer leur confidentialité et leur intégrité.
                </p>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Cookies</h2>
                <p>Le site n’utilise pas de cookies tiers pour le suivi publicitaire.</p>
                <p>Des cookies techniques peuvent être utilisés uniquement pour le bon fonctionnement du site.</p>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Vos droits</h2>
                <p>
                    Conformément au Règlement Général sur la Protection des Données (RGPD), vous pouvez exercer vos droits d’accès,
                    de rectification, de suppression et d’opposition aux données vous concernant.
                </p>
                <p>Pour cela, vous pouvez contacter : <a href="mailto:marion@mg-conseil.pro" className=" hover:underline">marion@mg-conseil.pro</a></p>
            </section>
        </div>
    )
}