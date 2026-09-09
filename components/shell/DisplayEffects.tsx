import styles from './DisplayEffects.module.css';

export default function DisplayEffects({ enabled }: { enabled: boolean }) {
  return <div aria-hidden="true" hidden={!enabled} data-crt-effects className={styles.effects}>
    <div data-crt-texture className={styles.texture}>
      <div className={styles.phosphor} />
      <div className={styles.raster} />
      <div className={styles.grain} />
    </div>
    <div className={styles.vignette} />
    <div className={styles.glass} />
  </div>;
}
