import styles from './StatusPage.module.css';
interface Props { label: string; value: string; unit: string; }
export default function StatusMetric({ label, value, unit }: Props) {
  return <div className={styles.metric}><p>{label}</p><p className={styles.value}>{value}</p><p>{unit}</p></div>;
}
