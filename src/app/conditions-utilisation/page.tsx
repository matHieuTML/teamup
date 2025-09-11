'use client'

import React from 'react'
import { MainLayout } from '@/components/layout'
import styles from './page.module.css'

export default function ConditionsUtilisationPage() {
  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Conditions d'Utilisation</h1>
          <p className={styles.lastUpdated}>Dernière mise à jour : 11 septembre 2025</p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Acceptation des conditions</h2>
            <p className={styles.text}>
              En utilisant l'application TeamUp, vous acceptez d'être lié par ces conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>2. Description du service</h2>
            <p className={styles.text}>
              TeamUp est une application mobile et web qui permet aux utilisateurs de créer, découvrir et 
              participer à des événements sportifs. Notre plateforme facilite la mise en relation entre 
              sportifs partageant les mêmes intérêts.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Inscription et compte utilisateur</h2>
            <p className={styles.text}>
              Pour utiliser certaines fonctionnalités de TeamUp, vous devez créer un compte. Vous êtes 
              responsable de maintenir la confidentialité de vos informations de connexion et de toutes 
              les activités qui se produisent sous votre compte.
            </p>
            <ul className={styles.list}>
              <li>Vous devez fournir des informations exactes et complètes lors de l'inscription</li>
              <li>Vous devez mettre à jour vos informations si elles changent</li>
              <li>Vous êtes responsable de la sécurité de votre mot de passe</li>
              <li>Vous devez nous notifier immédiatement de toute utilisation non autorisée</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>4. Utilisation acceptable</h2>
            <p className={styles.text}>
              Vous acceptez d'utiliser TeamUp uniquement à des fins légales et de manière respectueuse 
              envers les autres utilisateurs. Il est interdit de :
            </p>
            <ul className={styles.list}>
              <li>Publier du contenu offensant, discriminatoire ou illégal</li>
              <li>Harceler ou intimider d'autres utilisateurs</li>
              <li>Utiliser le service à des fins commerciales non autorisées</li>
              <li>Tenter de compromettre la sécurité de l'application</li>
              <li>Créer de faux comptes ou usurper l'identité d'autrui</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>5. Événements et responsabilité</h2>
            <p className={styles.text}>
              TeamUp facilite la création et la découverte d'événements sportifs, mais n'est pas 
              responsable du déroulement des événements eux-mêmes. Les organisateurs et participants 
              sont seuls responsables de leur sécurité et de leurs actions.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>6. Propriété intellectuelle</h2>
            <p className={styles.text}>
              Le contenu de TeamUp, incluant mais non limité au design, textes, graphiques, logos, 
              et code source, est protégé par les droits d'auteur et autres droits de propriété 
              intellectuelle.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>7. Protection des données</h2>
            <p className={styles.text}>
              Nous nous engageons à protéger vos données personnelles conformément au RGPD et à notre 
              politique de confidentialité. Vos données ne seront utilisées que dans le cadre du 
              fonctionnement de l'application.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>8. Modification des conditions</h2>
            <p className={styles.text}>
              Nous nous réservons le droit de modifier ces conditions d'utilisation à tout moment. 
              Les modifications prendront effet dès leur publication sur l'application. Il est de 
              votre responsabilité de consulter régulièrement ces conditions.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>9. Résiliation</h2>
            <p className={styles.text}>
              Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de 
              violation de ces conditions d'utilisation, sans préavis et à notre seule discrétion.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>10. Contact</h2>
            <p className={styles.text}>
              Pour toute question concernant ces conditions d'utilisation, vous pouvez nous contacter 
              à l'adresse : <strong>contact@teamup.fr</strong>
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
