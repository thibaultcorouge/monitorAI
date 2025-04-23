'use client'

export default function mentionLegale() {


    return(
        <div>
            <section className="max-w-3xl mx-auto mt-20 mb-20 p-6 bg-greenwhite rounded-2xl shadow-md ">
                <h1 className="text-3xl font-semibold border-b-2  pb-2 mb-6">Mentions légales</h1>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Éditeur du site</h2>
                <p>Le présent site est édité par :</p>
                <ul className="list-disc pl-6 space-y-1">
                <li> Thibault Corouge, résidant 7 rue de l&apos;abbé de l&apos;épée 75005 Paris.</li>
                <li>Téléphone : 06 23 39 20 64</li>
                <li>Courrier électronique : <a href="mailto:thibault.corouge@gmail.com">thibault.corouge@gmail.com</a></li>
                <li><strong>Numéro SIRET</strong> : [NUMERO_SIRET]</li>
                </ul>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Directeur de la publication</h2>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Nom</strong> : Marion Germa</li>
                    <li><strong>Email</strong> : <a href="mailto:marion@mg-conseil.pro" className="hover:underline">marion@mg-conseil.pro</a></li>
                </ul>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Hébergement</h2>
                <p>Le site est hébergé par :</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Nom de l’hébergeur</strong> : Vercel</li>
                    <li><strong>Adresse de l’hébergeur</strong> : 340 S Lemon Ave #4133 Walnut, CA 91789</li>
                    <li><strong>Site web</strong> : <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">https://vercel.com/</a></li>
                </ul>

                <h2 className="text-xl font-semibold  mt-6 mb-2">Propriété intellectuelle</h2>
                <p>
                    L’ensemble du contenu du site (textes, images, logo, etc.) est la propriété de <strong>MG Conseil</strong> sauf mention contraire.
                    Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site est interdite,
                    sauf autorisation écrite préalable.
                </p>
            </section>
        </div>
    )
}