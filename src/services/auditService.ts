import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuditLog {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: any;
  metadata?: any;
}

export const AuditService = {
  async logAction(log: Omit<AuditLog, 'timestamp'>) {
    try {
      const logsRef = collection(db, 'audit_logs');
      await addDoc(logsRef, {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  },

  async getRecentLogs(max: number = 50) {
    try {
      const logsRef = collection(db, 'audit_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(max));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
  }
};
