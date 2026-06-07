// App.js - نسخة كاملة جاهزة للتشغيل
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, FlatList, Alert, AppState, BackHandler,
  Modal, RefreshControl, SafeAreaView, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// 🕐 نظام تتبع وقت الاستخدام
// ============================================================
class UsageTracker {
  MAX_USAGE_HOURS = 0.08333; // 5 دقائق
  sessionStartTime = null;
  isTracking = false;

  startTracking = async () => {
    if (this.isTracking) return;
    const isFull = await this.isFullVersion();
    if (isFull) return;
    this.sessionStartTime = Date.now();
    this.isTracking = true;
  }

  stopAndSaveSession = async () => {
    if (!this.isTracking || !this.sessionStartTime) return 0;
    const sessionSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    if (sessionSeconds < 1) return 0;
    let totalSeconds = await this.getTotalUsageSeconds();
    const newTotalSeconds = totalSeconds + sessionSeconds;
    await this.saveTotalUsageSeconds(newTotalSeconds);
    this.isTracking = false;
    this.sessionStartTime = null;
    return sessionSeconds;
  }

  getTotalUsageSeconds = async () => {
    try {
      const saved = await AsyncStorage.getItem('@total_usage_seconds');
      return saved ? parseInt(saved) : 0;
    } catch (e) {
      return 0;
    }
  }

  saveTotalUsageSeconds = async (seconds) => {
    await AsyncStorage.setItem('@total_usage_seconds', seconds.toString());
  }

  checkValidity = async () => {
    const isFull = await this.isFullVersion();
    const maxSeconds = this.MAX_USAGE_HOURS * 3600;
    if (isFull) {
      return { isExpired: false, isFullVersion: true, remainingMinutes: 'غير محدود' };
    }
    const totalSeconds = await this.getTotalUsageSeconds();
    const isExpired = totalSeconds >= maxSeconds;
    const remainingSeconds = Math.max(0, maxSeconds - totalSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return { isExpired, isFullVersion: false, remainingMinutes };
  }

  showExpiredAlert = (onUnlockSuccess) => {
    Alert.prompt(
      '⏰ انتهت الفترة التجريبية',
      `لقد استنفذت 5 دقائق من وقت الاستخدام الفعلي للتطبيق.\n\n📞 للتواصل: 770970801\n\nأدخل مفتاح التفعيل:`,
      [
        { text: 'إغلاق', style: 'cancel', onPress: () => BackHandler.exitApp() },
        {
          text: '🔓 تفعيل',
          onPress: async (enteredKey) => {
            const result = await this.unlockFullVersion(enteredKey);
            if (result.success) {
              Alert.alert('✅ تم التفعيل', result.message);
              if (onUnlockSuccess) onUnlockSuccess();
            } else {
              Alert.alert('❌ خطأ', result.message);
            }
          }
        }
      ],
      'secure-text'
    );
  }

  unlockFullVersion = async (key) => {
    const MASTER_KEY = 'X9#mK2$pL8@nQ5!rT3&wY7';
    if (!key || key !== MASTER_KEY) return { success: false, message: '❌ مفتاح التفعيل غير صحيح' };
    await AsyncStorage.setItem('@full_version_unlocked', 'true');
    return { success: true, message: '✅ تم تفعيل النسخة الكاملة' };
  }

  isFullVersion = async () => {
    const unlocked = await AsyncStorage.getItem('@full_version_unlocked');
    return unlocked === 'true';
  }
}

const usageTracker = new UsageTracker();

// ============================================================
// 📦 البيانات الافتراضية
// ============================================================
const initialProducts = [
  { id: 'PROD-1001', name: 'فلتر زيت هيدروليك', category: 'قطع غيار ميكانيكية', quantity: 3, unit: 'قطعة', minQty: 5, location: 'رف A3', price: 150 },
  { id: 'PROD-1002', name: 'كابل كهربائي 4 ملم', category: 'قطع غيار كهربائية', quantity: 120, unit: 'متر', minQty: 20, location: 'مستودع B', price: 5 },
  { id: 'PROD-1003', name: 'زيت محرك 5W30', category: 'زيوت وشحوم', quantity: 0, unit: 'لتر', minQty: 10, location: 'رف C1', price: 45 },
  { id: 'PROD-1004', name: 'مفتاح ربط 12 ملم', category: 'أدوات', quantity: 15, unit: 'قطعة', minQty: 2, location: 'صندوق 1', price: 25 },
];

const initialTransactions = [
  { id: 'TX-504', type: 'منصرف', productName: 'فلتر زيت هيدروليك', qty: 1, date: '2026-06-03', user: 'محمد', ref: 'إذن صرف #60' },
  { id: 'TX-501', type: 'وارد', productName: 'كابل كهربائي 4 ملم', qty: 50, date: '2026-06-03', user: 'أحمد', ref: 'سند استلام #102' },
  { id: 'TX-502', type: 'منصرف', productName: 'فلتر زيت هيدروليك', qty: 2, date: '2026-06-02', user: 'خالد', ref: 'تقرير صيانة #WR-99' },
  { id: 'TX-503', type: 'وارد', productName: 'مفتاح ربط 12 ملم', qty: 5, date: '2026-06-01', user: 'أحمد', ref: 'سند استلام #101' },
];

const initialSuppliers = [
  { id: 'SUP-01', name: 'شركة الفهد للمعدات', phone: '0501234567', material: 'قطع غيار ميكانيكية', rating: 'ممتاز' },
  { id: 'SUP-02', name: 'محل الشهاب ليت', phone: '0559876543', material: 'كابلات ومواد كهربائية', rating: 'جيد جداً' },
];

const initialUsers = [
  { id: 'U-01', name: 'admin', role: 'admin', password: '770970801', desc: 'مدير النظام' },
  { id: 'U-02', name: 'أحمد', role: 'storekeeper', password: '456', desc: 'أمين المخزن' },
  { id: 'U-03', name: 'خالد', role: 'engineer', password: '789', desc: 'مهندس صيانة' },
];

// ============================================================
// مكون التطبيق الرئيسي
// ============================================================
export default function App() {
  // حالة الترخيص
  const [isTrialValid, setIsTrialValid] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingMinutes, setRemainingMinutes] = useState(5);
  const [isFullVersion, setIsFullVersion] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  // حالة تسجيل الدخول
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // البيانات الأساسية
  const [products, setProducts] = useState(initialProducts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [users, setUsers] = useState(initialUsers);
  const [currentUserRole, setCurrentUserRole] = useState('admin');

  // حالة الإشعارات والترتيب
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [refreshing, setRefreshing] = useState(false);

  // طلب سريع
  const [quickIssueProduct, setQuickIssueProduct] = useState('');
  const [quickIssueQty, setQuickIssueQty] = useState('');
  const [quickIssueReason, setQuickIssueReason] = useState('');

  // حقول إدخال المنتج
  const [prodName, setProdName] = useState('');
  const [prodQty, setProdQty] = useState('');
  const [prodMinQty, setProdMinQty] = useState('');
  const [prodCategory, setProdCategory] = useState('قطع غيار ميكانيكية');
  const [prodUnit, setProdUnit] = useState('قطعة');
  const [prodLocation, setProdLocation] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // باقي الحقول
  const [uName, setUName] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('storekeeper');
  const [uDesc, setUDesc] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [maintProdId, setMaintProdId] = useState('');
  const [maintQty, setMaintQty] = useState('');
  const [maintReportId, setMaintReportId] = useState('');
  const [auditProdId, setAuditProdId] = useState('');
  const [auditActualQty, setAuditActualQty] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [inProdId, setInProdId] = useState('');
  const [inQty, setInQty] = useState('');
  const [inSupplier, setInSupplier] = useState('');
  const [inDocRef, setInDocRef] = useState('');
  const [outProdId, setOutProdId] = useState('');
  const [outQty, setOutQty] = useState('');
  const [outDept, setOutDept] = useState('');
  const [outDocRef, setOutDocRef] = useState('');
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supMaterial, setSupMaterial] = useState('');

  // حساب الإحصائيات
  const totalItems = products.length;
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= p.minQty);
  const outOfStockItems = products.filter(p => p.quantity === 0);
  const todayDate = new Date().toISOString().split('T')[0];
  const todayIn = transactions.filter(tx => tx.date === todayDate && tx.type === 'وارد').reduce((sum, tx) => sum + tx.qty, 0);
  const todayOut = transactions.filter(tx => tx.date === todayDate && tx.type === 'منصرف').reduce((sum, tx) => sum + tx.qty, 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);

  // تأثيرات الإشعارات
  useEffect(() => {
    const checkTrial = async () => {
      setIsLoading(true);
      const isFull = await usageTracker.isFullVersion();
      setIsFullVersion(isFull);
      const status = await usageTracker.checkValidity();
      if (status.isExpired && !status.isFullVersion) {
        setIsTrialValid(false);
        usageTracker.showExpiredAlert(() => {
          setIsFullVersion(true);
          setIsTrialValid(true);
        });
      } else {
        setIsTrialValid(true);
        setRemainingMinutes(status.remainingMinutes);
      }
      setIsLoading(false);
    };
    checkTrial();
  }, []);

  // إشعار الأصناف المنخفضة
  useEffect(() => {
    if (isLoggedIn && lowStockItems.length > 0 && !showLowStockAlert) {
      setTimeout(() => {
        Alert.alert(
          '⚠️ تنبيه المخزون',
          `يوجد ${lowStockItems.length} صنف أقل من الحد الأدنى:\n${lowStockItems.slice(0, 3).map(p => `• ${p.name} (${p.quantity}/${p.minQty})`).join('\n')}`,
          [{ text: 'حسناً', onPress: () => setShowLowStockAlert(true) }]
        );
      }, 1000);
    }
  }, [isLoggedIn, lowStockItems.length]);

  useEffect(() => {
    if (!isFullVersion && isTrialValid) {
      usageTracker.startTracking();
    }
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        await usageTracker.stopAndSaveSession();
      }
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        const status = await usageTracker.checkValidity();
        if (status.isExpired && !status.isFullVersion) {
          setIsTrialValid(false);
          usageTracker.showExpiredAlert(() => {
            setIsFullVersion(true);
            setIsTrialValid(true);
          });
        } else {
          usageTracker.startTracking();
          setRemainingMinutes(status.remainingMinutes);
        }
      }
      appStateRef.current = nextAppState;
    });
    return () => {
      subscription.remove();
      usageTracker.stopAndSaveSession();
    };
  }, [isFullVersion, isTrialValid]);

  // دوال إدارة المنتجات
  const handleSaveProduct = () => {
    if (!verifyPermission(['admin', 'storekeeper'])) return;
    if (!prodName || !prodQty || !prodMinQty || !prodLocation) {
      return Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول');
    }
    if (editingProductId) {
      setProducts(products.map(p => p.id === editingProductId ? {
        ...p,
        name: prodName,
        quantity: parseInt(prodQty),
        minQty: parseInt(prodMinQty),
        category: prodCategory,
        unit: prodUnit,
        location: prodLocation,
        price: prodPrice ? parseInt(prodPrice) : p.price
      } : p));
      Alert.alert('تم التعديل', 'تم تحديث بيانات الصنف');
      setEditingProductId(null);
    } else {
      const newProduct = {
        id: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: prodName,
        category: prodCategory,
        quantity: parseInt(prodQty),
        minQty: parseInt(prodMinQty),
        unit: prodUnit,
        location: prodLocation,
        price: prodPrice ? parseInt(prodPrice) : 35
      };
      setProducts([newProduct, ...products]);
      Alert.alert('تم الحفظ', 'تم إدراج الصنف بنجاح');
    }
    resetProductForm();
  };

  const resetProductForm = () => {
    setProdName('');
    setProdQty('');
    setProdMinQty('');
    setProdLocation('');
    setProdPrice('');
    setEditingProductId(null);
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdQty(product.quantity.toString());
    setProdMinQty(product.minQty.toString());
    setProdCategory(product.category);
    setProdUnit(product.unit);
    setProdLocation(product.location);
    setProdPrice(product.price.toString());
  };

  const handleDeleteProduct = (productId) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا الصنف؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', onPress: () => {
          setProducts(products.filter(p => p.id !== productId));
          Alert.alert('تم الحذف', 'تم حذف الصنف بنجاح');
        }
      }
    ]);
  };

  const getSortedProducts = () => {
    let filtered = products.filter(p =>
      p.name.includes(searchQuery) || p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'quantity': valA = a.quantity; valB = b.quantity; break;
        case 'minQty': valA = a.minQty; valB = b.minQty; break;
        case 'price': valA = a.price; valB = b.price; break;
        default: valA = a.name; valB = b.name;
      }
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  };

  const handleQuickIssue = () => {
    if (!quickIssueProduct || !quickIssueQty) {
      return Alert.alert('تنبيه', 'يرجى إدخال الصنف والكمية');
    }
    setCurrentScreen('out');
    setOutProdId(quickIssueProduct);
    setOutQty(quickIssueQty);
    setOutDept(quickIssueReason || 'طلب عاجل');
    setOutDocRef(`QR-${Date.now()}`);
    setQuickIssueProduct('');
    setQuickIssueQty('');
    setQuickIssueReason('');
  };

  // دوال أساسية
  const verifyPermission = (allowedRoles) => {
    if (allowedRoles.includes(currentUserRole)) return true;
    Alert.alert('❌ رفض الوصول', 'عذراً، لا تمتلك الصلاحية الكافية');
    return false;
  };

  const handleLogin = () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('الرجاء إدخال البيانات');
      return;
    }
    const foundUser = users.find(u => u.name === loginUsername && u.password === loginPassword);
    if (foundUser) {
      setIsLoggedIn(true);
      setCurrentUserRole(foundUser.role);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
      setCurrentScreen('dashboard');
      Alert.alert('مرحباً', `تم تسجيل الدخول كـ ${foundUser.name}`);
    } else {
      setLoginError('بيانات غير صحيحة');
    }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل خروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نعم', onPress: () => { setIsLoggedIn(false); setIsMenuOpen(false); } }
    ]);
  };

  const handleGoodsOutward = () => {
    if (!verifyPermission(['admin', 'storekeeper'])) return;
    if (!outProdId || !outQty) return Alert.alert('تنبيه', 'أكمل الحقول');
    const productIndex = products.findIndex(p => p.id === outProdId.toUpperCase());
    if (productIndex === -1) return Alert.alert('خطأ', 'الصنف غير موجود');
    const product = products[productIndex];
    const qty = parseInt(outQty);
    if (product.quantity < qty) return Alert.alert('فشل', 'الرصيد غير كاف');
    const updatedProducts = [...products];
    updatedProducts[productIndex] = { ...product, quantity: product.quantity - qty };
    setProducts(updatedProducts);
    const newTx = {
      id: `TX-${Date.now()}`,
      type: 'منصرف',
      productName: product.name,
      qty: qty,
      date: todayDate,
      user: outDept || 'مستخدم',
      ref: outDocRef || 'صرف مباشر'
    };
    setTransactions([newTx, ...transactions]);
    setOutProdId('');
    setOutQty('');
    setOutDept('');
    setOutDocRef('');
    Alert.alert('تم', 'تم الصرف بنجاح');
  };

  const handleGoodsInward = () => {
    if (!verifyPermission(['admin', 'storekeeper'])) return;
    if (!inProdId || !inQty) return Alert.alert('تنبيه', 'أكمل الحقول');
    const productIndex = products.findIndex(p => p.id === inProdId.toUpperCase());
    if (productIndex === -1) return Alert.alert('خطأ', 'الصنف غير موجود');
    const product = products[productIndex];
    const qty = parseInt(inQty);
    const updatedProducts = [...products];
    updatedProducts[productIndex] = { ...product, quantity: product.quantity + qty };
    setProducts(updatedProducts);
    const newTx = {
      id: `TX-${Date.now()}`,
      type: 'وارد',
      productName: product.name,
      qty: qty,
      date: todayDate,
      user: inSupplier || 'مورد',
      ref: inDocRef || 'فاتورة'
    };
    setTransactions([newTx, ...transactions]);
    setInProdId('');
    setInQty('');
    setInSupplier('');
    setInDocRef('');
    Alert.alert('تم', 'تم الاستلام بنجاح');
  };

  const handleMaintenanceIssue = () => {
    if (!verifyPermission(['admin', 'engineer'])) return;
    if (!maintProdId || !maintQty) return Alert.alert('تنبيه', 'أكمل الحقول');
    const productIndex = products.findIndex(p => p.id === maintProdId.toUpperCase());
    if (productIndex === -1) return Alert.alert('خطأ', 'الصنف غير موجود');
    const product = products[productIndex];
    const qty = parseInt(maintQty);
    if (product.quantity < qty) return Alert.alert('فشل', 'الرصيد غير كاف');
    const updatedProducts = [...products];
    updatedProducts[productIndex] = { ...product, quantity: product.quantity - qty };
    setProducts(updatedProducts);
    const newTx = {
      id: `TX-${Date.now()}`,
      type: 'منصرف',
      productName: product.name,
      qty: qty,
      date: todayDate,
      user: 'مهندس صيانة',
      ref: `تقرير #${maintReportId || 'صيانة'}`
    };
    setTransactions([newTx, ...transactions]);
    setMaintProdId('');
    setMaintQty('');
    setMaintReportId('');
    Alert.alert('تم', 'تم صرف المواد للصيانة');
  };

  const handleInventoryAudit = () => {
    if (!verifyPermission(['admin'])) return;
    if (!auditProdId || !auditActualQty) return Alert.alert('تنبيه', 'أكمل الحقول');
    const productIndex = products.findIndex(p => p.id === auditProdId.toUpperCase());
    if (productIndex === -1) return Alert.alert('خطأ', 'الصنف غير موجود');
    const product = products[productIndex];
    const actualQty = parseInt(auditActualQty);
    const difference = actualQty - product.quantity;
    const updatedProducts = [...products];
    updatedProducts[productIndex] = { ...product, quantity: actualQty };
    setProducts(updatedProducts);
    if (difference !== 0) {
      const newTx = {
        id: `TX-${Date.now()}`,
        type: difference > 0 ? 'وارد' : 'منصرف',
        productName: `[جرد] ${product.name}`,
        qty: Math.abs(difference),
        date: todayDate,
        user: 'مدير النظام',
        ref: auditNotes || 'تسوية جرد'
      };
      setTransactions([newTx, ...transactions]);
    }
    setAuditProdId('');
    setAuditActualQty('');
    setAuditNotes('');
    Alert.alert('تم', 'تم تصحيح الرصيد');
  };

  const handleAddSupplier = () => {
    if (!supName || !supPhone) return Alert.alert('تنبيه', 'أدخل البيانات');
    const newSupplier = {
      id: `SUP-${Date.now()}`,
      name: supName,
      phone: supPhone,
      material: supMaterial,
      rating: 'جديد'
    };
    setSuppliers([...suppliers, newSupplier]);
    setSupName('');
    setSupPhone('');
    setSupMaterial('');
    Alert.alert('تم', 'تم إضافة المورد');
  };

  const handleSaveUser = () => {
    if (!verifyPermission(['admin'])) return;
    if (!uName || !uPassword) return Alert.alert('تنبيه', 'أكمل الحقول');
    if (editingUserId) {
      setUsers(users.map(u => u.id === editingUserId ? { ...u, name: uName, password: uPassword, role: uRole, desc: uDesc } : u));
      setEditingUserId(null);
    } else {
      const newUser = { id: `U-${Date.now()}`, name: uName, password: uPassword, role: uRole, desc: uDesc || '' };
      setUsers([...users, newUser]);
    }
    setUName('');
    setUPassword('');
    setUDesc('');
    setURole('storekeeper');
    Alert.alert('تم', 'تم حفظ المستخدم');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filteredProducts = getSortedProducts();

  const switchScreen = (screen) => {
    setCurrentScreen(screen);
    setIsMenuOpen(false);
  };

  function handleEditUserClick(user) {
    setEditingUserId(user.id);
    setUName(user.name);
    setUPassword(user.password);
    setURole(user.role);
    setUDesc(user.desc);
  }

  function handleDeleteUser(userId) {
    Alert.alert('تأكيد', 'حذف المستخدم؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', onPress: () => { setUsers(users.filter(u => u.id !== userId)); Alert.alert('تم الحذف'); } }
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>جاري التحميل...</Text>
      </View>
    );
  }

  // شاشة تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>📦 نظام إدارة المخازن</Text>
          <Text style={styles.loginSubtitle}>تسجيل الدخول</Text>
          <TextInput
            style={styles.loginInput}
            placeholder="اسم المستخدم"
            value={loginUsername}
            onChangeText={setLoginUsername}
            textAlign="right"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={styles.loginInput}
            placeholder="كلمة المرور"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
            textAlign="right"
            placeholderTextColor="#94a3b8"
          />
          {loginError ? <Text style={styles.loginError}>{loginError}</Text> : null}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>دخول</Text>
          </TouchableOpacity>
          <Text style={styles.loginHint}>admin / 770970801 | أحمد / 456 | خالد / 789</Text>
        </View>
      </SafeAreaView>
    );
  }

  // شاشة انتهاء التجربة
  if (!isTrialValid && !isFullVersion) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <Text style={[styles.loginTitle, { color: '#ef4444' }]}>⏰ انتهت الفترة التجريبية</Text>
          <Text style={styles.loginSubtitle}>لقد استنفذت 5 دقائق من وقت الاستخدام</Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#10b981' }]}
            onPress={() => {
              Alert.prompt('تفعيل', 'أدخل مفتاح التفعيل:', async (key) => {
                const result = await usageTracker.unlockFullVersion(key);
                Alert.alert(result.success ? 'تم' : 'خطأ', result.message);
                if (result.success) {
                  setIsFullVersion(true);
                  setIsTrialValid(true);
                }
              });
            }}
          >
            <Text style={styles.loginButtonText}>🔓 تفعيل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => Linking.openURL('tel:770970801')}
          >
            <Text style={styles.loginButtonText}>📞 تواصل</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // التطبيق الرئيسي
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.roleIndicator, { backgroundColor: currentUserRole === 'admin' ? '#ef4444' : currentUserRole === 'storekeeper' ? '#10b981' : '#f59e0b' }]}>
            <Text style={{ fontSize: 10, color: '#fff' }}>{currentUserRole === 'admin' ? 'مدير' : currentUserRole === 'storekeeper' ? 'مخزن' : 'مهندس'}</Text>
          </View>
          <Text style={styles.headerTitle}>📦 إدارة المخازن</Text>
          {!isFullVersion && <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 }}>
            <Text style={{ fontSize: 9, color: '#fff' }}>⏳ {remainingMinutes} د</Text>
          </View>}
        </View>
        <TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)}>
          <Text style={{ fontSize: 24, color: '#fff' }}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {/* Dashboard */}
        {currentScreen === 'dashboard' && (
          <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
            <Text style={styles.welcomeText}>مرحباً بك 👋</Text>
            <View style={styles.grid}>
              <View style={[styles.card, { borderColor: '#3b82f6', borderTopWidth: 4 }]}>
                <Text style={styles.cardValue}>{totalItems}</Text>
                <Text style={styles.cardLabel}>إجمالي الأصناف</Text>
              </View>
              <View style={[styles.card, { borderColor: '#f59e0b', borderTopWidth: 4 }]}>
                <Text style={styles.cardValue}>{lowStockItems.length}</Text>
                <Text style={styles.cardLabel}>منخفض المخزون</Text>
              </View>
              <View style={[styles.card, { borderColor: '#ef4444', borderTopWidth: 4 }]}>
                <Text style={styles.cardValue}>{outOfStockItems.length}</Text>
                <Text style={styles.cardLabel}>نفد المخزون</Text>
              </View>
            </View>
            <View style={styles.grid}>
              <View style={[styles.card, { borderColor: '#10b981', borderTopWidth: 4 }]}>
                <Text style={[styles.cardValue, { color: '#10b981' }]}>+{todayIn}</Text>
                <Text style={styles.cardLabel}>الوارد اليوم</Text>
              </View>
              <View style={[styles.card, { borderColor: '#ec4899', borderTopWidth: 4 }]}>
                <Text style={[styles.cardValue, { color: '#ec4899' }]}>-{todayOut}</Text>
                <Text style={styles.cardLabel}>المنصرف اليوم</Text>
              </View>
              <View style={[styles.card, { borderColor: '#8b5cf6', borderTopWidth: 4 }]}>
                <Text style={styles.cardValue}>{totalStockValue}</Text>
                <Text style={styles.cardLabel}>قيمة المخزون</Text>
              </View>
            </View>

            {/* زر الطلب السريع */}
            <View style={[styles.formCard, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
              <Text style={[styles.formTitle, { color: '#f59e0b' }]}>⚡ طلب مواد سريع</Text>
              <TextInput placeholder="كود الصنف" value={quickIssueProduct} onChangeText={setQuickIssueProduct} style={styles.input} autoCapitalize="characters" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="الكمية" value={quickIssueQty} onChangeText={setQuickIssueQty} keyboardType="numeric" style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="السبب (اختياري)" value={quickIssueReason} onChangeText={setQuickIssueReason} style={styles.input} placeholderTextColor="#94a3b8" />
              <TouchableOpacity onPress={handleQuickIssue} style={[styles.btn, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.btnText}>🚀 تنفيذ الطلب السريع</Text>
              </TouchableOpacity>
            </View>

            {/* آخر الحركات */}
            <Text style={styles.sectionTitle}>📋 آخر الحركات</Text>
            {transactions.slice(0, 5).map(tx => (
              <View key={tx.id} style={styles.listItem}>
                <View style={[styles.badge, { backgroundColor: tx.type === 'وارد' ? '#d1fae5' : '#fee2e2' }]}>
                  <Text style={{ color: tx.type === 'وارد' ? '#065f46' : '#991b1b' }}>{tx.type} ({tx.qty})</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: 'bold' }}>{tx.productName}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{tx.user} | {tx.date}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* إدارة الأصناف مع تعديل وحذف */}
        {currentScreen === 'products' && (
          <View style={{ flex: 1 }}>
            <View style={styles.searchBar}>
              <TextInput placeholder="🔍 بحث..." value={searchQuery} onChangeText={setSearchQuery} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholderTextColor="#94a3b8" />
            </View>
            <View style={styles.sortBar}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>ترتيب:</Text>
              <TouchableOpacity onPress={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={styles.sortBtn}>
                <Text>الاسم {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSortBy('quantity'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={styles.sortBtn}>
                <Text>الكمية {sortBy === 'quantity' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSortBy('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={styles.sortBtn}>
                <Text>السعر {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              style={styles.container}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListHeaderComponent={
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>{editingProductId ? '✏️ تعديل صنف' : '➕ إضافة صنف جديد'}</Text>
                  <TextInput placeholder="اسم الصنف" value={prodName} onChangeText={setProdName} style={styles.input} placeholderTextColor="#94a3b8" />
                  <View style={{ flexDirection: 'row' }}>
                    <TextInput placeholder="الكمية" value={prodQty} keyboardType="numeric" onChangeText={setProdQty} style={[styles.input, { flex: 1, marginRight: 5 }]} placeholderTextColor="#94a3b8" />
                    <TextInput placeholder="الحد الأدنى" value={prodMinQty} keyboardType="numeric" onChangeText={setProdMinQty} style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholderTextColor="#94a3b8" />
                  </View>
                  <TextInput placeholder="السعر" value={prodPrice} keyboardType="numeric" onChangeText={setProdPrice} style={styles.input} placeholderTextColor="#94a3b8" />
                  <TextInput placeholder="الموقع" value={prodLocation} onChangeText={setProdLocation} style={styles.input} placeholderTextColor="#94a3b8" />
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={handleSaveProduct} style={[styles.btn, { flex: 2 }]}>
                      <Text style={styles.btnText}>💾 حفظ</Text>
                    </TouchableOpacity>
                    {editingProductId && <TouchableOpacity onPress={resetProductForm} style={[styles.btn, { flex: 1, backgroundColor: '#64748b', marginLeft: 8 }]}>
                      <Text style={styles.btnText}>إلغاء</Text>
                    </TouchableOpacity>}
                  </View>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View>
                    <Text style={{ fontWeight: 'bold', color: item.quantity <= item.minQty ? '#ef4444' : '#10b981' }}>{item.quantity} {item.unit}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{item.id}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{item.location} | {item.price} ريال</Text>
                    <View style={{ flexDirection: 'row', marginTop: 5 }}>
                      <TouchableOpacity onPress={() => handleEditProduct(item)} style={styles.actionBtn}>
                        <Text style={{ color: '#2563eb' }}>تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteProduct(item.id)} style={[styles.actionBtn, { marginLeft: 8 }]}>
                        <Text style={{ color: '#ef4444' }}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* صيانة */}
        {currentScreen === 'maintenance' && (
          <ScrollView style={styles.container}>
            <View style={styles.formCard}>
              <Text style={[styles.formTitle, { color: '#ef4444' }]}>⚙️ سحب مواد للصيانة</Text>
              <TextInput placeholder="كود الصنف" value={maintProdId} onChangeText={setMaintProdId} style={styles.input} autoCapitalize="characters" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="الكمية" value={maintQty} keyboardType="numeric" onChangeText={setMaintQty} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="رقم التقرير" value={maintReportId} onChangeText={setMaintReportId} style={styles.input} placeholderTextColor="#94a3b8" />
              <TouchableOpacity onPress={handleMaintenanceIssue} style={[styles.btn, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.btnText}>اعتماد الصرف</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* جرد */}
        {currentScreen === 'audit' && (
          <ScrollView style={styles.container}>
            <View style={styles.formCard}>
              <Text style={[styles.formTitle, { color: '#f59e0b' }]}>🔍 جرد المخزون</Text>
              <TextInput placeholder="كود الصنف" value={auditProdId} onChangeText={setAuditProdId} style={styles.input} autoCapitalize="characters" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="الكمية الفعلية" value={auditActualQty} keyboardType="numeric" onChangeText={setAuditActualQty} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="ملاحظات" value={auditNotes} onChangeText={setAuditNotes} style={styles.input} placeholderTextColor="#94a3b8" />
              <TouchableOpacity onPress={handleInventoryAudit} style={[styles.btn, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.btnText}>تسوية الجرد</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* استلام */}
        {currentScreen === 'in' && (
          <ScrollView style={styles.container}>
            <View style={styles.formCard}>
              <Text style={[styles.formTitle, { color: '#10b981' }]}>📥 استلام شحنة</Text>
              <TextInput placeholder="كود الصنف" value={inProdId} onChangeText={setInProdId} style={styles.input} autoCapitalize="characters" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="الكمية" value={inQty} keyboardType="numeric" onChangeText={setInQty} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="المورد" value={inSupplier} onChangeText={setInSupplier} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="رقم الفاتورة" value={inDocRef} onChangeText={setInDocRef} style={styles.input} placeholderTextColor="#94a3b8" />
              <TouchableOpacity onPress={handleGoodsInward} style={[styles.btn, { backgroundColor: '#10b981' }]}>
                <Text style={styles.btnText}>تسجيل الاستلام</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* صرف */}
        {currentScreen === 'out' && (
          <ScrollView style={styles.container}>
            <View style={styles.formCard}>
              <Text style={[styles.formTitle, { color: '#ec4899' }]}>📤 صرف مواد</Text>
              <TextInput placeholder="كود الصنف" value={outProdId} onChangeText={setOutProdId} style={styles.input} autoCapitalize="characters" placeholderTextColor="#94a3b8" />
              <TextInput placeholder="الكمية" value={outQty} keyboardType="numeric" onChangeText={setOutQty} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="القسم المستلم" value={outDept} onChangeText={setOutDept} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="رقم الإذن" value={outDocRef} onChangeText={setOutDocRef} style={styles.input} placeholderTextColor="#94a3b8" />
              <TouchableOpacity onPress={handleGoodsOutward} style={[styles.btn, { backgroundColor: '#ec4899' }]}>
                <Text style={styles.btnText}>اعتماد الصرف</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* الموردون */}
        {currentScreen === 'suppliers' && (
          <FlatList
            data={suppliers}
            keyExtractor={item => item.id}
            style={styles.container}
            ListHeaderComponent={
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>🏭 إضافة مورد</Text>
                <TextInput placeholder="الاسم" value={supName} onChangeText={setSupName} style={styles.input} placeholderTextColor="#94a3b8" />
                <TextInput placeholder="الهاتف" value={supPhone} keyboardType="phone-pad" onChangeText={setSupPhone} style={styles.input} placeholderTextColor="#94a3b8" />
                <TextInput placeholder="التخصص" value={supMaterial} onChangeText={setSupMaterial} style={styles.input} placeholderTextColor="#94a3b8" />
                <TouchableOpacity onPress={handleAddSupplier} style={styles.btn}>
                  <Text style={styles.btnText}>إضافة</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={{ color: '#0369a1' }}>📞 {item.phone}</Text>
                <View>
                  <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ fontSize: 11 }}>{item.material}</Text>
                </View>
              </View>
            )}
          />
        )}

        {/* التقارير */}
        {currentScreen === 'reports' && (
          <ScrollView style={styles.container}>
            <Text style={styles.welcomeText}>📈 التقارير</Text>
            <View style={styles.formCard}>
              <Text style={{ fontWeight: 'bold', textAlign: 'right' }}>💰 القيمة الإجمالية: {totalStockValue} ريال</Text>
            </View>
            <View style={styles.formCard}>
              <Text style={{ textAlign: 'right' }}>📦 إجمالي الأصناف: {totalItems}</Text>
              <Text style={{ textAlign: 'right' }}>⚠️ أصناف منخفضة: {lowStockItems.length}</Text>
              <Text style={{ textAlign: 'right' }}>❌ أصناف نافدة: {outOfStockItems.length}</Text>
              <Text style={{ textAlign: 'right' }}>📥 وارد اليوم: {todayIn}</Text>
              <Text style={{ textAlign: 'right' }}>📤 منصرف اليوم: {todayOut}</Text>
            </View>
          </ScrollView>
        )}

        {/* المستخدمون */}
        {currentScreen === 'roles' && (
          <ScrollView style={styles.container}>
            <Text style={styles.welcomeText}>👥 المستخدمون</Text>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingUserId ? 'تعديل' : 'إضافة مستخدم'}</Text>
              <TextInput placeholder="الاسم" value={uName} onChangeText={setUName} style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="كلمة المرور" value={uPassword} onChangeText={setUPassword} secureTextEntry style={styles.input} placeholderTextColor="#94a3b8" />
              <TextInput placeholder="الوصف" value={uDesc} onChangeText={setUDesc} style={styles.input} placeholderTextColor="#94a3b8" />
              <View style={styles.rolePickerRow}>
                <TouchableOpacity onPress={() => setURole('admin')} style={[styles.pickerBtn, uRole === 'admin' && styles.activePickerAdmin]}>
                  <Text>مدير</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setURole('storekeeper')} style={[styles.pickerBtn, uRole === 'storekeeper' && styles.activePickerStore]}>
                  <Text>مخزن</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setURole('engineer')} style={[styles.pickerBtn, uRole === 'engineer' && styles.activePickerEng]}>
                  <Text>مهندس</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleSaveUser} style={styles.btn}>
                <Text style={styles.btnText}>حفظ</Text>
              </TouchableOpacity>
            </View>
            {users.map(user => (
              <View key={user.id} style={styles.listItem}>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => handleEditUserClick(user)}>
                    <Text style={{ color: '#2563eb' }}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteUser(user.id)} style={{ marginLeft: 10 }}>
                    <Text style={{ color: '#ef4444' }}>حذف</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  <Text style={{ fontWeight: 'bold' }}>{user.name}</Text>
                  <Text style={{ fontSize: 11 }}>{user.role}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* القائمة الجانبية */}
        {isMenuOpen && (
          <View style={styles.customDrawer}>
            <Text style={styles.drawerHeader}>📋 القائمة</Text>
            <TouchableOpacity onPress={() => switchScreen('dashboard')} style={[styles.drawerItem, currentScreen === 'dashboard' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>📊 لوحة التحكم</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('products')} style={[styles.drawerItem, currentScreen === 'products' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>📦 الأصناف</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('maintenance')} style={[styles.drawerItem, currentScreen === 'maintenance' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>⚙️ الصيانة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('audit')} style={[styles.drawerItem, currentScreen === 'audit' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>🔍 الجرد</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('in')} style={[styles.drawerItem, currentScreen === 'in' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>📥 استلام</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('out')} style={[styles.drawerItem, currentScreen === 'out' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>📤 صرف</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('suppliers')} style={[styles.drawerItem, currentScreen === 'suppliers' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>🏭 الموردون</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('reports')} style={[styles.drawerItem, currentScreen === 'reports' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>📈 التقارير</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchScreen('roles')} style={[styles.drawerItem, currentScreen === 'roles' && styles.activeItem]}>
              <Text style={styles.drawerItemText}>👥 المستخدمون</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.drawerItem, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ef4444' }]}>
              <Text style={[styles.drawerItemText, { color: '#ef4444' }]}>🚪 خروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// التنسيقات
// ============================================================
const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 25
  },
  loginInput: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 15,
    fontSize: 16
  },
  loginError: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 15
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  loginHint: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 20
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    height: 60,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 4
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8
  },
  roleIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  container: {
    flex: 1,
    padding: 15
  },
  welcomeText: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    color: '#0f172a'
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 4,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  cardLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'right',
    color: '#1e293b'
  },
  listItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  formCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
    color: '#0f172a'
  },
  input: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10,
    textAlign: 'right'
  },
  btn: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 10,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  sortBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
    marginBottom: 5
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f1f5f9'
  },
  rolePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  activePickerAdmin: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444'
  },
  activePickerStore: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981'
  },
  activePickerEng: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b'
  },
  customDrawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 240,
    backgroundColor: '#1e293b',
    padding: 15,
    zIndex: 999
  },
  drawerHeader: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 10
  },
  drawerItem: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    borderRadius: 6
  },
  activeItem: {
    backgroundColor: '#334155'
  },
  drawerItemText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
  },
});
