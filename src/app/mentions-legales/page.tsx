'use client'

import React from 'react'
import { MainLayout } from '@/components/layout'
import styles from './page.module.css'

export default function MentionsLegalesPage() {
  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Mentions Légales</h1>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Éditeur du site</h2>
            <div className={styles.sectionContent}>
              <p><strong>TeamUp</strong></p>
              <p>Application de mise en relation pour activités sportives</p>
              <p>Email : contact@teamup.fr</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Hébergement</h2>
            <div className={styles.sectionContent}>
              <p><strong>Firebase (Google Cloud Platform)</strong></p>
              <p>Google LLC</p>
              <p>1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Données personnelles</h2>
            <div className={styles.sectionContent}>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD), 
                vous disposez d'un droit d'accès, de rectification, de portabilité et 
                d'effacement de vos données personnelles.
              </p>
              <p>
                Les données collectées sont utilisées uniquement dans le cadre du 
                fonctionnement de l'application TeamUp et ne sont pas transmises à des tiers.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cookies</h2>
            <div className={styles.sectionContent}>
              <p>
                Cette application utilise des cookies techniques nécessaires à son 
                fonctionnement, notamment pour l'authentification et la sauvegarde 
                des préférences utilisateur.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Propriété intellectuelle</h2>
            <div className={styles.sectionContent}>
              <p>
                L'ensemble des contenus présents sur TeamUp (textes, images, logos) 
                sont protégés par le droit d'auteur. Toute reproduction sans 
                autorisation est interdite.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Responsabilité</h2>
            <div className={styles.sectionContent}>
              <p>
                TeamUp est une plateforme de mise en relation. Les utilisateurs 
                sont responsables de leurs activités et interactions. L'éditeur 
                ne peut être tenu responsable des dommages résultant de l'utilisation 
                de l'application.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact</h2>
            <div className={styles.sectionContent}>
              <p>
                Pour toute question concernant ces mentions légales ou vos données 
                personnelles, vous pouvez nous contacter à : 
                <strong> contact@teamup.fr</strong>
              </p>
            </div>
          </section>

          <div className={styles.lastUpdate}>
            <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
