import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [letterContent, setLetterContent] = useState('');
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase.from('friends').select('*').order('name');
      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('목록 불러오기 실패:', error);
      alert('목록을 불러올 수 없습니다.');
    }
  };

  const fetchLetters = async (friendId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('letters')
        .select('*, likes:likes(id)')
        .eq('friend_id', friendId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const lettersWithLikes = data.map(letter => ({
        ...letter,
        likes_count: letter.likes ? letter.likes.length : 0
      }));

      setLetters(lettersWithLikes || []);
    } catch (error) {
      console.error('편지 불러오기 실패:', error);
      alert('편지를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sendLetter = async () => {
    if (!selectedFriend || !letterContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('letters')
        .insert([{ friend_id: selectedFriend.id, content: letterContent }]);

      if (error) throw error;

      setLetterContent('');
      fetchLetters(selectedFriend.id);
    } catch (error) {
      console.error('전송 실패:', error);
      alert('전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectFriend = (friend) => {
    setSelectedFriend(friend);
    fetchLetters(friend.id);
  };

  const handleLike = async (letterId) => {
    const likedLetters = JSON.parse(localStorage.getItem('likedLetters') || '[]').map(Number);
    if (likedLetters.includes(Number(letterId))) {
      alert('이미 좋아요를 눌렀습니다.');
      return;
    }

    try {
      const { error } = await supabase
        .from('likes')
        .insert([{ letter_id: letterId, friend_id: selectedFriend.id }]);

      if (error) throw error;

      setLetters(letters.map(l => 
        l.id === letterId ? { ...l, likes_count: (l.likes_count || 0) + 1 } : l
      ));

      localStorage.setItem('likedLetters', JSON.stringify([...likedLetters, Number(letterId)]));
    } catch (error) {
      console.error('좋아요 실패:', error);
      alert('좋아요 반영 실패');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '10px' }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
        overflow: 'hidden' 
      }}>
        {/* 헤더 */}
        <div style={{ 
          backgroundColor: '#6B8E23', 
          color: 'white', 
          padding: '20px', 
          textAlign: 'center' 
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🖤 익명 편지함 🖤</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>이상한 거 보이면 삭제함</p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          minHeight: '600px' 
        }}>
          {/* 친구 목록 - 5명씩 2줄 */}
          <div style={{ 
            width: isMobile ? '100%' : '300px',
            padding: '15px',
            borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
            marginBottom: isMobile ? '10px' : '0'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              maxWidth: '100%'
            }}>
              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => selectFriend(friend)}
                  style={{
                    padding: '8px 4px',
                    backgroundColor: selectedFriend?.id === friend.id ? '#6B8E23' : '#f3f4f6',
                    color: selectedFriend?.id === friend.id ? 'white' : '#111827',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0
                  }}
                >
                  {friend.name}
                </button>
              ))}
            </div>
          </div>

          {/* 메인 */}
          <div style={{ flex: 1, padding: '20px' }}>
            {!selectedFriend ? (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px' }}>
                <p style={{ fontSize: '18px' }}>빤쑤 선택</p>
              </div>
            ) : (
              <>
                <h2 style={{ margin: '0 0 20px 0', color: '#065f46' }}>
                  {selectedFriend.name}에게 익명편지
                </h2>

                {/* 편지 작성 */}
                <div style={{ marginBottom: '20px' }}>
                  <textarea
                    value={letterContent}
                    onChange={(e) => setLetterContent(e.target.value)}
                    placeholder="나쁜 말 쓰라고 만든 곳 아닌 거 알지"
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      maxHeight: '250px',
                      padding: '15px',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={sendLetter}
                    disabled={loading || !letterContent.trim()}
                    style={{
                      marginTop: '10px',
                      backgroundColor: loading ? '#9ca3af' : '#6B8E23',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {loading ? '전송 중...' : '익명 편지 보내기'}
                  </button>
                </div>

                {/* 편지 목록 */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', color: '#065f46' }}>
                    {selectedFriend.name} 익명 편지 {letters.length}개
                  </h3>
                  {loading ? (
                    <p style={{ color: '#6b7280' }}>로딩 중...</p>
                  ) : letters.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>익명 좀 써줘~~</p>
                  ) : (
                    <div>
                      {letters.map(letter => (
                        <div
                          key={letter.id}
                          style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '10px'
                          }}
                        >
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            lineHeight: '1.5', 
                            color: '#111827' 
                          }}>
                            {letter.content}
                          </p>
                          <small style={{ color: '#6b7280' }}>
                            {new Date(letter.created_at).toLocaleString('ko-KR')}
                          </small>
                          <div style={{ marginTop: '8px' }}>
                            <button
                              onClick={() => handleLike(letter.id)}
                              style={{
                                background: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              👍 {letter.likes_count || 0}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;