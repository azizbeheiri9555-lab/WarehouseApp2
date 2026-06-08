// App.js - تطبيق مفكرة عصري وبسيط
import React, { useState, useEffect } from 'react';
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
  Switch,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  // الحالات الرئيسية
  const [notes, setNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState({ id: null, title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // تحميل الملاحظات عند فتح التطبيق
  useEffect(() => {
    loadNotes();
    loadDarkMode();
  }, []);

  // حفظ الملاحظات تلقائياً
  useEffect(() => {
    saveNotes();
  }, [notes]);

  // تحميل الملاحظات من التخزين
  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@smart_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        // ملاحظات تجريبية
        setNotes([
          { id: '1', title: 'مرحباً بك في المفكرة 📝', content: 'هذه مفكرتك الذكية. يمكنك إضافة ملاحظات جديدة وتعديلها وحذفها.', date: new Date().toLocaleDateString('ar-SA') },
          { id: '2', title: 'نصيحة سريعة 💡', content: 'اضغط مع الاستمرار على أي ملاحظة لحذفها.', date: new Date().toLocaleDateString('ar-SA') },
        ]);
      }
    } catch (error) {
      console.log('خطأ في تحميل الملاحظات');
    }
  };

  // حفظ الملاحظات
  const saveNotes = async () => {
    try {
      await AsyncStorage.setItem('@smart_notes', JSON.stringify(notes));
    } catch (error) {
      console.log('خطأ في حفظ الملاحظات');
    }
  };

  // تحميل وضع الليلي
  const loadDarkMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('@dark_mode');
      if (savedMode !== null) {
        setDarkMode(JSON.parse(savedMode));
      }
    } catch (error) {
      console.log('خطأ في تحميل الوضع');
    }
  };

  // حفظ وضع الليلي
  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem('@dark_mode', JSON.stringify(newMode));
  };

  // إضافة ملاحظة جديدة
  const addNote = () => {
    setCurrentNote({ id: null, title: '', content: '' });
    setModalVisible(true);
  };

  // حفظ الملاحظة (إضافة أو تعديل)
  const saveNote = () => {
    if (!currentNote.title.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال عنوان للملاحظة');
      return;
    }

    const now = new Date().toLocaleDateString('ar-SA');
    
    if (currentNote.id) {
      // تعديل ملاحظة موجودة
      setNotes(notes.map(note => 
        note.id === currentNote.id 
          ? { ...currentNote, date: now }
          : note
      ));
      Alert.alert('تم', 'تم تعديل الملاحظة بنجاح');
    } else {
      // إضافة ملاحظة جديدة
      const newNote = {
        id: Date.now().toString(),
        title: currentNote.title,
        content: currentNote.content,
        date: now
      };
      setNotes([newNote, ...notes]);
      Alert.alert('تم', 'تم إضافة الملاحظة بنجاح');
    }
    
    setModalVisible(false);
    setCurrentNote({ id: null, title: '', content: '' });
  };

  // حذف ملاحظة
  const deleteNote = (id) => {
    Alert.alert(
      'حذف ملاحظة',
      'هل أنت متأكد من حذف هذه الملاحظة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', onPress: () => {
          setNotes(notes.filter(note => note.id !== id));
          Alert.alert('تم', 'تم حذف الملاحظة');
        }}
      ]
    );
  };

  // تعديل ملاحظة
  const editNote = (note) => {
    setCurrentNote(note);
    setModalVisible(true);
  };

  // البحث في الملاحظات
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // الألوان حسب الوضع
  const colors = {
    background: darkMode ? '#1a1a2e' : '#f5f5f5',
    cardBg: darkMode ? '#16213e' : '#ffffff',
    text: darkMode ? '#eeeeee' : '#333333',
    textSecondary: darkMode ? '#aaaaaa' : '#666666',
    border: darkMode ? '#0f3460' : '#e0e0e0',
    primary: '#6c63ff',
    danger: '#ff6b6b',
  };

  // عرض ملاحظة واحدة (شبكة)
  const renderGridNote = ({ item }) => (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => editNote(item)}
      onLongPress={() => deleteNote(item.id)}
      activeOpacity={0.7}
    >
      <Text style={[styles.gridTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.gridContent, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.content || 'لا يوجد محتوى'}
      </Text>
      <Text style={[styles.gridDate, { color: colors.textSecondary }]}>{item.date}</Text>
    </TouchableOpacity>
  );

  // عرض ملاحظة واحدة (قائمة)
  const renderListItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => editNote(item)}
      onLongPress={() => deleteNote(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.listContent}>
        <Text style={[styles.listTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.listPreview, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.content || 'لا يوجد محتوى'}
        </Text>
        <Text style={[styles.listDate, { color: colors.textSecondary }]}>{item.date}</Text>
      </View>
      <View style={styles.listIcon}>
        <Text style={{ fontSize: 30 }}>📄</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      
      {/* الرأس */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>📝 مفكرتي</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {filteredNotes.length} ملاحظة
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} style={styles.iconBtn}>
            <Text style={{ fontSize: 24 }}>{viewMode === 'grid' ? '☷' : '▦'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.iconBtn}>
            <Text style={{ fontSize: 24 }}>{darkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* شريط البحث */}
      <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={{ fontSize: 18, marginRight: 10 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="بحث في الملاحظات..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 16, color: colors.primary }}>✖</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* قائمة الملاحظات */}
      {filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>📭</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'لا توجد نتائج بحث' : 'لا توجد ملاحظات بعد'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {searchQuery ? 'جرب كلمات أخرى' : 'اضغط على زر + لإضافة ملاحظة جديدة'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={item => item.id}
          renderItem={viewMode === 'grid' ? renderGridNote : renderListItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* زر الإضافة */}
      <TouchableOpacity style={styles.fab} onPress={addNote}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* نافذة إضافة/تعديل ملاحظة */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {currentNote.id ? '✏️ تعديل ملاحظة' : '➕ ملاحظة جديدة'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.danger }]}>✖</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.inputTitle, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="العنوان"
              placeholderTextColor={colors.textSecondary}
              value={currentNote.title}
              onChangeText={(text) => setCurrentNote({ ...currentNote, title: text })}
            />
            
            <TextInput
              style={[styles.inputContent, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="المحتوى..."
              placeholderTextColor={colors.textSecondary}
              value={currentNote.content}
              onChangeText={(text) => setCurrentNote({ ...currentNote, content: text })}
              multiline
              textAlignVertical="top"
            />
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveNote}>
              <Text style={styles.saveBtnText}>💾 حفظ الملاحظة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconBtn: {
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    textAlign: 'right',
  },
  notesList: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  gridCard: {
    flex: 1,
    margin: 6,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    minHeight: 120,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  gridContent: {
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'right',
  },
  gridDate: {
    fontSize: 10,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'right',
  },
  listPreview: {
    fontSize: 13,
    marginBottom: 5,
    textAlign: 'right',
  },
  listDate: {
    fontSize: 10,
    textAlign: 'right',
  },
  listIcon: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  inputTitle: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'right',
  },
  inputContent: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 150,
    marginBottom: 20,
    textAlign: 'right',
  },
  saveBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
