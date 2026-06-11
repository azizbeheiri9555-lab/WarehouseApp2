// App.js - النسخة المتكاملة بجميع الميزات الحديثة
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Vibration,
  BackHandler,
  Share,
  Switch,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// الألوان المتاحة
const COLORS = [
  { id: 'white', name: 'أبيض', bg: '#ffffff', text: '#333333', icon: '⚪' },
  { id: 'yellow', name: 'أصفر', bg: '#fff9c4', text: '#333333', icon: '🟡' },
  { id: 'green', name: 'أخضر', bg: '#e8f5e9', text: '#1b5e20', icon: '🟢' },
  { id: 'blue', name: 'أزرق', bg: '#e3f2fd', text: '#0d47a1', icon: '🔵' },
  { id: 'purple', name: 'بنفسجي', bg: '#f3e5f5', text: '#4a148c', icon: '🟣' },
  { id: 'pink', name: 'وردي', bg: '#fce4ec', text: '#880e4f', icon: '🌸' },
  { id: 'orange', name: 'برتقالي', bg: '#fff3e0', text: '#e65100', icon: '🟠' },
  { id: 'dark', name: 'داكن', bg: '#1e1e2e', text: '#ffffff', icon: '🌙' },
];

// التصنيفات المتاحة
const TAGS = [
  { id: 'work', name: 'عمل', icon: '💼' },
  { id: 'personal', name: 'شخصي', icon: '👤' },
  { id: 'ideas', name: 'أفكار', icon: '💡' },
  { id: 'tasks', name: 'مهام', icon: '✅' },
  { id: 'important', name: 'مهم', icon: '⭐' },
  { id: 'shopping', name: 'تسوق', icon: '🛒' },
  { id: 'health', name: 'صحة', icon: '🏃' },
  { id: 'study', name: 'دراسة', icon: '📚' },
];

// كلمة المرور الافتراضية (يمكن تغييرها)
const DEFAULT_PASSWORD = '1234';

export default function App() {
  // ==================== الحالات الأساسية ====================
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [notes, setNotes] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ==================== ميزة المجلدات ====================
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(COLORS[0]);
  const [editingFolder, setEditingFolder] = useState(null);
  
  // ==================== ميزة الملاحظات ====================
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    id: null, title: '', content: '', color: COLORS[0], tags: [],
    reminder: null, checklist: [], attachments: [], isLocked: false
  });
  
  // ==================== ميزة قوائم المهام ====================
  const [checklistItem, setChecklistItem] = useState('');
  
  // ==================== ميزة التذكيرات ====================
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // ==================== ميزة القفل ====================
  const [lockScreen, setLockScreen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [lockedNoteId, setLockedNoteId] = useState(null);
  
  // ==================== ميزة سلة المحذوفات ====================
  const [trash, setTrash] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  
  // ==================== ميزة الإحصائيات ====================
  const [showStats, setShowStats] = useState(false);
  
  // ==================== ميزة الإدخال الصوتي ====================
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  
  // ==================== ميزة النسخ الاحتياطي ====================
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // ==================== تحميل البيانات ====================
  useEffect(() => {
    loadData();
    loadDarkMode();
    setupBackHandler();
  }, []);
  
  const setupBackHandler = () => {
    const backAction = () => {
      if (selectedFolder) {
        setSelectedFolder(null);
        setNotes([]);
        setSearchQuery('');
        return true;
      } else if (showTrash) {
        setShowTrash(false);
        return true;
      } else if (showStats) {
        setShowStats(false);
        return true;
      } else if (lockScreen) {
        setLockScreen(false);
        return true;
      }
      BackHandler.exitApp();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };
  
  const loadData = async () => {
    try {
      const savedFolders = await AsyncStorage.getItem('@smart_folders_v2');
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      } else {
        const defaultFolders = [
          { id: '1', name: 'العمل', color: COLORS[2], notes: [
            { id: 'n1', title: 'اجتماع اليوم', content: 'الساعة 10 صباحاً', color: COLORS[2], tags: ['work'], date: new Date().toLocaleDateString('ar-SA'), checklist: [], attachments: [], isLocked: false }
          ]},
          { id: '2', name: 'شخصي', color: COLORS[1], notes: [
            { id: 'n2', title: 'قائمة التسوق', content: 'حليب - خبز - بيض', color: COLORS[1], tags: ['shopping'], date: new Date().toLocaleDateString('ar-SA'), checklist: [{ text: 'حليب', checked: false }, { text: 'خبز', checked: false }], attachments: [], isLocked: false }
          ]},
          { id: '3', name: 'أفكار', color: COLORS[3], notes: [
            { id: 'n3', title: 'فكرة تطبيق جديد', content: 'تطبيق لإدارة الوقت مع ميزات متقدمة', color: COLORS[3], tags: ['ideas'], date: new Date().toLocaleDateString('ar-SA'), checklist: [], attachments: [], isLocked: false }
          ]},
        ];
        setFolders(defaultFolders);
        await AsyncStorage.setItem('@smart_folders_v2', JSON.stringify(defaultFolders));
      }
      const savedTrash = await AsyncStorage.getItem('@smart_trash');
      if (savedTrash) setTrash(JSON.parse(savedTrash));
    } catch (error) { console.log('خطأ في تحميل البيانات'); }
  };
  
  const saveFolders = async (newFolders) => {
    try {
      await AsyncStorage.setItem('@smart_folders_v2', JSON.stringify(newFolders));
    } catch (error) { console.log('خطأ في حفظ المجلدات'); }
  };
  
  const loadDarkMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('@dark_mode');
      if (savedMode !== null) setDarkMode(JSON.parse(savedMode));
    } catch (error) {}
  };
  
  // ==================== إدارة المجلدات ====================
  const addFolder = () => {
    if (!newFolderName.trim()) return Alert.alert('تنبيه', 'الرجاء إدخال اسم للمجلد');
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      color: newFolderColor,
      notes: [],
      date: new Date().toLocaleDateString('ar-SA')
    };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
    setNewFolderName('');
    setNewFolderColor(COLORS[0]);
    setFolderModalVisible(false);
    Alert.alert('تم', `تم إنشاء مجلد "${newFolderName}"`);
  };
  
  const deleteFolder = (folderId, folderName) => {
    Alert.alert('حذف مجلد', `حذف مجلد "${folderName}" سيحذف جميع الملاحظات داخله`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', onPress: () => {
        const updatedFolders = folders.filter(f => f.id !== folderId);
        setFolders(updatedFolders);
        saveFolders(updatedFolders);
        if (selectedFolder?.id === folderId) setSelectedFolder(null);
        Alert.alert('تم', 'تم حذف المجلد');
      }}
    ]);
  };
  
  // ==================== إدارة الملاحظات ====================
  const addNote = () => {
    setCurrentNote({
      id: null, title: '', content: '', color: selectedFolder?.color || COLORS[0],
      tags: [], reminder: null, checklist: [], attachments: [], isLocked: false
    });
    setModalVisible(true);
  };
  
  const saveNote = () => {
    if (!currentNote.title.trim()) return Alert.alert('تنبيه', 'الرجاء إدخال عنوان');
    const now = new Date().toLocaleDateString('ar-SA');
    let updatedFolders;
    
    if (currentNote.id) {
      updatedFolders = folders.map(folder => folder.id === selectedFolder.id ? {
        ...folder, notes: folder.notes.map(note => note.id === currentNote.id ? { ...currentNote, date: now } : note)
      } : folder);
    } else {
      const newNote = { ...currentNote, id: Date.now().toString(), date: now };
      updatedFolders = folders.map(folder => folder.id === selectedFolder.id ? { ...folder, notes: [newNote, ...folder.notes] } : folder);
    }
    
    setFolders(updatedFolders);
    saveFolders(updatedFolders);
    const updatedFolder = updatedFolders.find(f => f.id === selectedFolder.id);
    setSelectedFolder(updatedFolder);
    setNotes(updatedFolder.notes);
    setModalVisible(false);
    Alert.alert('تم', currentNote.id ? 'تم تعديل الملاحظة' : 'تم إضافة الملاحظة');
  };
  
  const deleteNote = (noteId) => {
    Alert.alert('حذف ملاحظة', 'نقل إلى سلة المحذوفات؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'نقل', onPress: () => {
        const noteToDelete = notes.find(n => n.id === noteId);
        setTrash([{ ...noteToDelete, deletedAt: new Date().toLocaleDateString('ar-SA') }, ...trash]);
        AsyncStorage.setItem('@smart_trash', JSON.stringify(trash));
        const updatedFolders = folders.map(folder => folder.id === selectedFolder.id ? { ...folder, notes: folder.notes.filter(n => n.id !== noteId) } : folder);
        setFolders(updatedFolders);
        saveFolders(updatedFolders);
        const updatedFolder = updatedFolders.find(f => f.id === selectedFolder.id);
        setSelectedFolder(updatedFolder);
        setNotes(updatedFolder.notes);
        Alert.alert('تم', 'تم نقل الملاحظة إلى سلة المحذوفات');
      }}
    ]);
  };
  
  const restoreNote = (noteId) => {
    const noteToRestore = trash.find(t => t.id === noteId);
    const originalFolder = folders.find(f => f.name === noteToRestore.originalFolder || f.id === noteToRestore.folderId);
    if (originalFolder) {
      const updatedFolders = folders.map(f => f.id === originalFolder.id ? { ...f, notes: [noteToRestore, ...f.notes] } : f);
      setFolders(updatedFolders);
      saveFolders(updatedFolders);
    }
    setTrash(trash.filter(t => t.id !== noteId));
    AsyncStorage.setItem('@smart_trash', JSON.stringify(trash));
    Alert.alert('تم', 'تم استعادة الملاحظة');
  };
  
  const deletePermanent = (noteId) => {
    Alert.alert('حذف نهائي', 'لن تتمكن من استعادة هذه الملاحظة', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', onPress: () => {
        setTrash(trash.filter(t => t.id !== noteId));
        AsyncStorage.setItem('@smart_trash', JSON.stringify(trash));
        Alert.alert('تم', 'تم حذف الملاحظة نهائياً');
      }}
    ]);
  };
  
  // ==================== ميزة قوائم المهام (Checklist) ====================
  const addChecklistItem = () => {
    if (!checklistItem.trim()) return;
    setCurrentNote({
      ...currentNote,
      checklist: [...currentNote.checklist, { text: checklistItem.trim(), checked: false, id: Date.now().toString() }]
    });
    setChecklistItem('');
  };
  
  const toggleChecklistItem = (itemId) => {
    setCurrentNote({
      ...currentNote,
      checklist: currentNote.checklist.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item)
    });
  };
  
  const removeChecklistItem = (itemId) => {
    setCurrentNote({
      ...currentNote,
      checklist: currentNote.checklist.filter(item => item.id !== itemId)
    });
  };
  
  // ==================== ميزة المرفقات ====================
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('تنبيه', 'تحتاج إلى منح إذن الوصول إلى المعرض');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      setCurrentNote({
        ...currentNote,
        attachments: [...currentNote.attachments, { type: 'image', uri: result.assets[0].uri, id: Date.now().toString() }]
      });
    }
  };
  
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets) {
      setCurrentNote({
        ...currentNote,
        attachments: [...currentNote.attachments, { type: 'document', name: result.assets[0].name, uri: result.assets[0].uri, id: Date.now().toString() }]
      });
    }
  };
  
  const removeAttachment = (attachmentId) => {
    setCurrentNote({ ...currentNote, attachments: currentNote.attachments.filter(a => a.id !== attachmentId) });
  };
  
  // ==================== ميزة التذكيرات ====================
  const setReminder = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(false);
    setShowTimePicker(true);
    setSelectedDate(currentDate);
  };
  
  const setReminderTime = (event, selected) => {
    setShowTimePicker(false);
    if (selected) {
      const reminderDate = new Date(selectedDate);
      reminderDate.setHours(selected.getHours(), selected.getMinutes());
      setCurrentNote({ ...currentNote, reminder: reminderDate });
      Alert.alert('تم', `تم تعيين تذكير في ${reminderDate.toLocaleString('ar-SA')}`);
    }
  };
  
  // ==================== ميزة القفل ====================
  const lockNote = () => {
    if (currentNote.isLocked) {
      setCurrentNote({ ...currentNote, isLocked: false });
      Alert.alert('تم', 'تم إزالة القفل عن الملاحظة');
    } else {
      setLockScreen(true);
      setLockedNoteId(currentNote.id);
    }
  };
  
  const verifyPassword = () => {
    if (tempPassword === DEFAULT_PASSWORD) {
      setCurrentNote({ ...currentNote, isLocked: true });
      setLockScreen(false);
      setTempPassword('');
      Alert.alert('تم', 'تم قفل الملاحظة بنجاح');
    } else {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة');
      setTempPassword('');
    }
  };
  
  const unlockNote = (note) => {
    setLockScreen(true);
    setLockedNoteId(note.id);
    setCurrentNote(note);
  };
  
  // ==================== ميزة المشاركة ====================
  const shareNote = async (note) => {
    try {
      await Share.share({
        message: `${note.title}\n\n${note.content}\n\nالتصنيفات: ${note.tags.join(', ')}\nالتاريخ: ${note.date}\n\n- من تطبيق مفكرتي`,
        title: note.title,
      });
    } catch (error) { Alert.alert('خطأ', 'تعذر مشاركة الملاحظة'); }
  };
  
  // ==================== ميزة الإدخال الصوتي ====================
  const startVoiceInput = () => {
    // محاكاة للإدخال الصوتي (في الإصدار الحقيقي تستخدم expo-speech-recognition)
    setIsRecording(true);
    Alert.alert('🎤 إدخال صوتي', 'تحدث الآن...', [
      { text: 'إلغاء', style: 'cancel', onPress: () => setIsRecording(false) },
      { text: 'إيقاف', onPress: () => {
        setIsRecording(false);
        Alert.prompt('النص الذي تم التعرف عليه', 'أدخل النص أو استخدم النص المقترح:', [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إضافة', onPress: (text) => {
            setCurrentNote({ ...currentNote, content: currentNote.content + (text || 'نص تم إدخاله صوتياً') });
          }}
        ]);
      }}
    ]);
  };
  
  // ==================== ميزة النسخ الاحتياطي ====================
  const backupData = async () => {
    setIsBackingUp(true);
    try {
      const backup = {
        folders,
        trash,
        date: new Date().toISOString(),
        version: '2.0'
      };
      await AsyncStorage.setItem('@smart_backup', JSON.stringify(backup));
      Alert.alert('✅ نجاح', 'تم إنشاء نسخة احتياطية بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل إنشاء النسخة الاحتياطية');
    }
    setIsBackingUp(false);
  };
  
  const restoreBackup = async () => {
    try {
      const backup = await AsyncStorage.getItem('@smart_backup');
      if (backup) {
        const data = JSON.parse(backup);
        setFolders(data.folders);
        setTrash(data.trash);
        await saveFolders(data.folders);
        await AsyncStorage.setItem('@smart_trash', JSON.stringify(data.trash));
        Alert.alert('✅ نجاح', 'تم استعادة النسخة الاحتياطية');
      } else {
        Alert.alert('تنبيه', 'لا توجد نسخة احتياطية سابقة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل استعادة النسخة الاحتياطية');
    }
  };
  
  // ==================== الإحصائيات ====================
  const getStats = () => {
    let totalWords = 0;
    let totalChecklists = 0;
    let totalAttachments = 0;
    folders.forEach(folder => {
      folder.notes.forEach(note => {
        totalWords += (note.content || '').split(' ').length;
        totalChecklists += note.checklist?.length || 0;
        totalAttachments += note.attachments?.length || 0;
      });
    });
    return { totalNotes: notes.length, totalFolders: folders.length, totalWords, totalChecklists, totalAttachments, totalTrash: trash.length };
  };
  
  const stats = getStats();
  
  // ==================== واجهة المستخدم ====================
  const colors = {
    background: darkMode ? '#1a1a2e' : '#f5f5f5',
    cardBg: darkMode ? '#16213e' : '#ffffff',
    text: darkMode ? '#eeeeee' : '#333333',
    textSecondary: darkMode ? '#aaaaaa' : '#666666',
    border: darkMode ? '#0f3460' : '#e0e0e0',
    primary: '#6c63ff',
    success: '#10b981',
    danger: '#ff6b6b',
    warning: '#f59e0b',
  };
  
  const renderFolder = ({ item }) => (
    <TouchableOpacity style={[styles.folderCard, { backgroundColor: item.color.bg, borderColor: colors.border }]} onPress={() => { setSelectedFolder(item); setNotes(item.notes); }} onLongPress={() => { Vibration.vibrate(50); Alert.alert(item.name, 'اختر إجراء', [{ text: 'تعديل', onPress: () => { setEditingFolder(item); setNewFolderName(item.name); setNewFolderColor(item.color); setFolderModalVisible(true); } }, { text: 'حذف', onPress: () => deleteFolder(item.id, item.name), style: 'destructive' }, { text: 'إلغاء', style: 'cancel' }]); }} activeOpacity={0.7}>
      <Text style={{ fontSize: 40, marginBottom: 10 }}>{item.color.icon}</Text>
      <Text style={[styles.folderName, { color: item.color.text }]}>{item.name}</Text>
      <Text style={[styles.folderCount, { color: item.color.text + '99' }]}>{item.notes.length} ملاحظات</Text>
    </TouchableOpacity>
  );
  
  const renderNote = ({ item }) => (
    <TouchableOpacity style={[styles.noteCard, { backgroundColor: item.color?.bg || colors.cardBg, borderColor: colors.border }]} onPress={() => { if (item.isLocked) unlockNote(item); else { setCurrentNote(item); setModalVisible(true); } }} onLongPress={() => deleteNote(item.id)} activeOpacity={0.7}>
      <View style={styles.noteHeader}>
        <View style={styles.noteTags}>{item.tags?.slice(0, 2).map(tag => <View key={tag} style={styles.noteTag}><Text style={{ fontSize: 10 }}>{TAGS.find(t => t.id === tag)?.icon || '🏷️'}</Text></View>)}</View>
        {item.isLocked && <Text style={{ fontSize: 14 }}>🔒</Text>}
        {item.reminder && <Text style={{ fontSize: 14 }}>⏰</Text>}
      </View>
      <Text style={[styles.noteTitle, { color: item.color?.text || colors.text }]}>{item.title}</Text>
      <Text style={[styles.noteContent, { color: (item.color?.text || colors.text) + 'cc' }]} numberOfLines={2}>{item.content || 'لا يوجد محتوى'}</Text>
      {item.checklist?.length > 0 && <Text style={[styles.noteMeta, { color: (item.color?.text || colors.text) + '99' }]}>✅ {item.checklist.filter(i => i.checked).length}/{item.checklist.length}</Text>}
      {item.attachments?.length > 0 && <Text style={[styles.noteMeta, { color: (item.color?.text || colors.text) + '99' }]}>📎 {item.attachments.length} مرفق</Text>}
      <Text style={[styles.noteDate, { color: (item.color?.text || colors.text) + '99' }]}>{item.date}</Text>
    </TouchableOpacity>
  );
  
  const getFilteredNotes = () => {
    if (!searchQuery.trim()) return notes;
    return notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* شاشة القفل */}
      {lockScreen && (
        <View style={[styles.lockScreen, { backgroundColor: colors.background }]}>
          <Text style={[styles.lockTitle, { color: colors.text }]}>🔒 ملاحظة مقفلة</Text>
          <TextInput style={[styles.lockInput, { backgroundColor: colors.cardBg, color: colors.text, borderColor: colors.border }]} placeholder="أدخل كلمة المرور" placeholderTextColor={colors.textSecondary} secureTextEntry value={tempPassword} onChangeText={setTempPassword} textAlign="center" />
          <TouchableOpacity style={[styles.lockButton, { backgroundColor: colors.primary }]} onPress={verifyPassword}><Text style={styles.lockButtonText}>فتح</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => { setLockScreen(false); setTempPassword(''); }}><Text style={{ color: colors.danger, marginTop: 15 }}>إلغاء</Text></TouchableOpacity>
        </View>
      )}
      
      {!lockScreen && (
        <>
          {/* الرأس */}
          <View style={styles.header}>
            <View><Text style={[styles.headerTitle, { color: colors.text }]}>{selectedFolder ? `📁 ${selectedFolder.name}` : '📚 مفكرتي'}</Text><Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{selectedFolder ? `${getFilteredNotes().length} ملاحظة` : `${folders.length} مجلد`}</Text></View>
            <View style={styles.headerButtons}>
              {selectedFolder && <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.iconBtn}><Text style={{ fontSize: 22 }}>{viewMode === 'grid' ? '☷' : '▦'}</Text></TouchableOpacity>}
              <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}><Text style={{ fontSize: 22 }}>{darkMode ? '☀️' : '🌙'}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowStats(!showStats)} style={styles.iconBtn}><Text style={{ fontSize: 22 }}>📊</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTrash(!showTrash)} style={styles.iconBtn}><Text style={{ fontSize: 22 }}>{showTrash ? '📝' : '🗑️'}</Text></TouchableOpacity>
              {selectedFolder && <TouchableOpacity onPress={() => { setSelectedFolder(null); setNotes([]); setSearchQuery(''); }} style={styles.iconBtn}><Text style={{ fontSize: 22 }}>📂</Text></TouchableOpacity>}
            </View>
          </View>
          
          {/* شريط البحث */}
          {selectedFolder && !showTrash && !showStats && (<View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}><Text style={{ fontSize: 18, marginRight: 10 }}>🔍</Text><TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="بحث..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} /></View>)}
          
          {/* الإحصائيات */}
          {showStats && (<View style={[styles.statsCard, { backgroundColor: colors.cardBg }]}><Text style={[styles.statsTitle, { color: colors.text }]}>📊 إحصائياتك</Text><View style={styles.statsRow}><View style={styles.statItem}><Text style={[styles.statNumber, { color: colors.primary }]}>{stats.totalNotes}</Text><Text style={{ color: colors.textSecondary }}>ملاحظات</Text></View><View style={styles.statItem}><Text style={[styles.statNumber, { color: colors.success }]}>{stats.totalFolders}</Text><Text style={{ color: colors.textSecondary }}>مجلدات</Text></View><View style={styles.statItem}><Text style={[styles.statNumber, { color: colors.warning }]}>{stats.totalWords}</Text><Text style={{ color: colors.textSecondary }}>كلمات</Text></View></View><View style={styles.statsRow}><View style={styles.statItem}><Text style={[styles.statNumber, { color: '#8b5cf6' }]}>{stats.totalChecklists}</Text><Text style={{ color: colors.textSecondary }}>مهام</Text></View><View style={styles.statItem}><Text style={[styles.statNumber, { color: '#ec4899' }]}>{stats.totalAttachments}</Text><Text style={{ color: colors.textSecondary }}>مرفقات</Text></View><View style={styles.statItem}><Text style={[styles.statNumber, { color: colors.danger }]}>{stats.totalTrash}</Text><Text style={{ color: colors.textSecondary }}>محذوفة</Text></View></View></View>)}
          
          {/* المحتوى الرئيسي */}
          {showTrash ? (trash.length === 0 ? (<View style={styles.emptyContainer}><Text style={{ fontSize: 48 }}>🗑️</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>سلة المحذوفات فارغة</Text></View>) : (<FlatList data={trash} keyExtractor={item => item.id} renderItem={({ item }) => (<View style={[styles.trashItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}><Text style={[styles.trashTitle, { color: colors.text }]}>{item.title}</Text><Text style={[styles.trashDate, { color: colors.textSecondary }]}>حذفت: {item.deletedAt}</Text><View style={styles.trashActions}><TouchableOpacity onPress={() => restoreNote(item.id)} style={styles.restoreBtn}><Text>↩️ استعادة</Text></TouchableOpacity><TouchableOpacity onPress={() => deletePermanent(item.id)} style={styles.deletePermBtn}><Text>🗑️ حذف نهائي</Text></TouchableOpacity></View></View>)} contentContainerStyle={styles.listContainer} />)) : !selectedFolder ? (folders.length === 0 ? (<View style={styles.emptyContainer}><Text style={{ fontSize: 48 }}>📂</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا توجد مجلدات</Text><TouchableOpacity onPress={() => setFolderModalVisible(true)} style={styles.emptyButton}><Text style={styles.emptyButtonText}>+ أنشئ مجلد جديد</Text></TouchableOpacity></View>) : (<FlatList key={`folders-${viewMode}`} data={folders} keyExtractor={item => item.id} renderItem={renderFolder} numColumns={2} contentContainerStyle={styles.listContainer} />)) : (getFilteredNotes().length === 0 ? (<View style={styles.emptyContainer}><Text style={{ fontSize: 48 }}>📝</Text><Text style={[styles.emptyText, { color: colors.textSecondary }]}>{searchQuery ? 'لا توجد نتائج' : 'لا توجد ملاحظات'}</Text>{!searchQuery && (<TouchableOpacity onPress={addNote} style={styles.emptyButton}><Text style={styles.emptyButtonText}>+ أضف ملاحظة</Text></TouchableOpacity>)}</View>) : (<FlatList key={`notes-${viewMode}`} data={getFilteredNotes()} keyExtractor={item => item.id} renderItem={renderNote} numColumns={viewMode === 'grid' ? 2 : 1} contentContainerStyle={styles.listContainer} />))}
          
          {/* زر الإضافة */}
          <TouchableOpacity style={styles.fab} onPress={selectedFolder ? addNote : () => setFolderModalVisible(true)}><Text style={styles.fabText}>+</Text></TouchableOpacity>
          
          {/* زر النسخ الاحتياطي */}
          {!selectedFolder && !showTrash && !showStats && (<TouchableOpacity style={[styles.backupBtn, { backgroundColor: colors.primary }]} onPress={backupData}><Text style={styles.backupBtnText}>💾 نسخ احتياطي</Text></TouchableOpacity>)}
        </>
      )}
      
      {/* ==================== نوافذ منبثقة ==================== */}
      
      {/* نافذة إنشاء مجلد */}
      <Modal visible={folderModalVisible} transparent animationType="slide"><View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}><Text style={[styles.modalTitle, { color: colors.text }]}>{editingFolder ? '✏️ تعديل مجلد' : '📁 مجلد جديد'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>{COLORS.map(color => (<TouchableOpacity key={color.id} style={[styles.colorOption, { backgroundColor: color.bg, borderWidth: newFolderColor.id === color.id ? 3 : 1, borderColor: newFolderColor.id === color.id ? colors.primary : '#ccc' }]} onPress={() => setNewFolderColor(color)}><Text style={{ fontSize: 30 }}>{color.icon}</Text></TouchableOpacity>))}</ScrollView><TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="اسم المجلد" value={newFolderName} onChangeText={setNewFolderName} textAlign="right" /><View style={styles.modalButtons}><TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#64748b' }]} onPress={() => { setFolderModalVisible(false); setEditingFolder(null); setNewFolderName(''); }}><Text style={styles.modalBtnText}>إلغاء</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={editingFolder ? () => { if (newFolderName.trim()) { const updated = folders.map(f => f.id === editingFolder.id ? { ...f, name: newFolderName.trim(), color: newFolderColor } : f); setFolders(updated); saveFolders(updated); setFolderModalVisible(false); setEditingFolder(null); setNewFolderName(''); Alert.alert('تم', 'تم تعديل المجلد'); } } : addFolder}><Text style={styles.modalBtnText}>{editingFolder ? 'تعديل' : 'إنشاء'}</Text></TouchableOpacity></View></View></View></Modal>
      
      {/* نافذة إضافة/تعديل ملاحظة - متكاملة بجميع الميزات */}
      <Modal visible={modalVisible} transparent animationType="slide"><View style={styles.modalOverlay}><ScrollView style={[styles.modalContent, { backgroundColor: colors.cardBg, maxHeight: '90%' }]}><Text style={[styles.modalTitle, { color: colors.text }]}>{currentNote.id ? '✏️ تعديل' : '➕ ملاحظة جديدة'}</Text>
        
        {/* ألوان الملاحظة */}
        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>🎨 لون الملاحظة:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>{COLORS.map(color => (<TouchableOpacity key={color.id} style={[styles.colorOptionSmall, { backgroundColor: color.bg, borderWidth: currentNote.color?.id === color.id ? 3 : 1, borderColor: currentNote.color?.id === color.id ? colors.primary : '#ccc' }]} onPress={() => setCurrentNote({ ...currentNote, color: color })}><Text style={{ fontSize: 20 }}>{color.icon}</Text></TouchableOpacity>))}</ScrollView>
        
        {/* التصنيفات */}
        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>🏷️ التصنيفات:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsPicker}>{TAGS.map(tag => (<TouchableOpacity key={tag.id} style={[styles.tagOption, { backgroundColor: currentNote.tags?.includes(tag.id) ? colors.primary : colors.background, borderColor: colors.border }]} onPress={() => { const newTags = currentNote.tags?.includes(tag.id) ? currentNote.tags.filter(t => t !== tag.id) : [...(currentNote.tags || []), tag.id]; setCurrentNote({ ...currentNote, tags: newTags }); }}><Text>{tag.icon}</Text><Text style={{ color: currentNote.tags?.includes(tag.id) ? '#fff' : colors.text, marginLeft: 5 }}>{tag.name}</Text></TouchableOpacity>))}</ScrollView>
        
        <TextInput style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="العنوان" value={currentNote.title} onChangeText={(text) => setCurrentNote({ ...currentNote, title: text })} />
        <TextInput style={[styles.inputContent, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="المحتوى..." value={currentNote.content} onChangeText={(text) => setCurrentNote({ ...currentNote, content: text })} multiline textAlignVertical="top" />
        
        {/* قائمة مهام */}
        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>✅ قائمة مهام:</Text>
        <View style={styles.checklistContainer}>{currentNote.checklist?.map(item => (<View key={item.id} style={styles.checklistItem}><TouchableOpacity onPress={() => toggleChecklistItem(item.id)}><Text style={{ fontSize: 20, marginRight: 10 }}>{item.checked ? '✅' : '⬜'}</Text></TouchableOpacity><Text style={[styles.checklistText, { color: colors.text, textDecorationLine: item.checked ? 'line-through' : 'none' }]}>{item.text}</Text><TouchableOpacity onPress={() => removeChecklistItem(item.id)}><Text style={{ color: colors.danger, fontSize: 18 }}>🗑️</Text></TouchableOpacity></View>))}</View>
        <View style={styles.addChecklist}><TextInput style={[styles.checklistInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} placeholder="أضف مهمة..." value={checklistItem} onChangeText={setChecklistItem} /><TouchableOpacity onPress={addChecklistItem} style={[styles.addChecklistBtn, { backgroundColor: colors.primary }]}><Text style={{ color: '#fff' }}>إضافة</Text></TouchableOpacity></View>
        
        {/* المرفقات */}
        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>📎 مرفقات:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{currentNote.attachments?.map(att => (<View key={att.id} style={styles.attachmentItem}><Text>{att.type === 'image' ? '🖼️' : '📄'}</Text><TouchableOpacity onPress={() => removeAttachment(att.id)}><Text style={{ color: colors.danger }}>✖</Text></TouchableOpacity></View>))}</ScrollView>
        <View style={styles.attachmentButtons}><TouchableOpacity onPress={pickImage} style={[styles.attachBtn, { backgroundColor: colors.success }]}><Text style={{ color: '#fff' }}>📷 صورة</Text></TouchableOpacity><TouchableOpacity onPress={pickDocument} style={[styles.attachBtn, { backgroundColor: colors.primary }]}><Text style={{ color: '#fff' }}>📄 ملف</Text></TouchableOpacity></View>
        
        {/* تذكير */}
        <TouchableOpacity style={[styles.reminderBtn, { backgroundColor: currentNote.reminder ? colors.success : colors.border }]} onPress={() => setShowDatePicker(true)}><Text style={{ color: currentNote.reminder ? '#fff' : colors.text }}>{currentNote.reminder ? `⏰ تذكير: ${new Date(currentNote.reminder).toLocaleString('ar-SA')}` : '🔔 إضافة تذكير'}</Text></TouchableOpacity>
        
        {/* قفل الملاحظة */}
        <View style={styles.lockRow}><Text style={{ color: colors.text }}>🔒 قفل الملاحظة</Text><Switch value={currentNote.isLocked} onValueChange={lockNote} trackColor={{ false: colors.border, true: colors.primary }} /></View>
        
        {/* زر المشاركة */}
        {currentNote.id && <TouchableOpacity onPress={() => shareNote(currentNote)} style={[styles.shareBtn, { backgroundColor: colors.primary }]}><Text style={styles.shareBtnText}>📤 مشاركة الملاحظة</Text></TouchableOpacity>}
        
        {/* زر الإدخال الصوتي */}
        <TouchableOpacity onPress={startVoiceInput} style={[styles.voiceBtn, { backgroundColor: colors.warning }]}><Text style={styles.voiceBtnText}>🎤 إدخال صوتي</Text></TouchableOpacity>
        
        <View style={styles.modalButtons}><TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#64748b' }]} onPress={() => setModalVisible(false)}><Text style={styles.modalBtnText}>إلغاء</Text></TouchableOpacity><TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={saveNote}><Text style={styles.modalBtnText}>حفظ</Text></TouchableOpacity></View>
      </ScrollView></View></Modal>
      
      {/* منتقي التاريخ والوقت */}
      {showDatePicker && <DateTimePicker value={selectedDate} mode="date" display="default" onChange={setReminder} />}
      {showTimePicker && <DateTimePicker value={selectedDate} mode="time" display="default" onChange={setReminderTime} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 3 },
  headerButtons: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 16, padding: 0, textAlign: 'right' },
  listContainer: { paddingHorizontal: 15, paddingBottom: 80 },
  folderCard: { flex: 1, margin: 8, padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, minHeight: 140 },
  folderName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  folderCount: { fontSize: 12 },
  noteCard: { marginBottom: 10, padding: 15, borderRadius: 15, borderWidth: 1 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noteTags: { flexDirection: 'row', gap: 4 },
  noteTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)' },
  noteTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' },
  noteContent: { fontSize: 13, marginBottom: 8, textAlign: 'right', lineHeight: 18 },
  noteMeta: { fontSize: 11, marginBottom: 4, textAlign: 'right' },
  noteDate: { fontSize: 10, textAlign: 'right' },
  statsCard: { marginHorizontal: 20, marginBottom: 15, padding: 15, borderRadius: 15 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold' },
  trashItem: { marginBottom: 10, padding: 15, borderRadius: 15, borderWidth: 1 },
  trashTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'right', marginBottom: 5 },
  trashDate: { fontSize: 11, textAlign: 'right', marginBottom: 10 },
  trashActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  restoreBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#10b981', borderRadius: 8 },
  deletePermBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ef4444', borderRadius: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { fontSize: 18, marginBottom: 8 },
  emptyButton: { marginTop: 20, backgroundColor: '#6c63ff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  emptyButtonText: { color: '#fff', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 25, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  backupBtn: { position: 'absolute', bottom: 25, left: 25, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 25 },
  backupBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalLabel: { fontSize: 14, marginBottom: 8, textAlign: 'right', fontWeight: 'bold' },
  colorPicker: { flexDirection: 'row', marginBottom: 15, maxHeight: 70 },
  colorOption: { width: 55, height: 55, borderRadius: 27, marginRight: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  colorOptionSmall: { width: 45, height: 45, borderRadius: 22, marginRight: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  tagsPicker: { flexDirection: 'row', marginBottom: 15, maxHeight: 50 },
  tagOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 15, textAlign: 'right' },
  inputContent: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, minHeight: 120, marginBottom: 15, textAlign: 'right' },
  checklistContainer: { marginBottom: 10 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checklistText: { flex: 1, fontSize: 14, textAlign: 'right' },
  addChecklist: { flexDirection: 'row', marginBottom: 15 },
  checklistInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, textAlign: 'right', marginRight: 8 },
  addChecklistBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  attachmentButtons: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  attachBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, marginRight: 8 },
  reminderBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  lockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  shareBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  shareBtnText: { color: '#fff', fontWeight: 'bold' },
  voiceBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  voiceBtnText: { color: '#fff', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  lockScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  lockInput: { width: '80%', borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 18, textAlign: 'center', marginBottom: 20 },
  lockButton: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  lockButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
