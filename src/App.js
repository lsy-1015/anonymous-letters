import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [letterContent, setLetterContent] = useState('');
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .order('name');
      
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
        .select('*')
        .eq('friend_id', friendId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLetters(data || []);
    } catch (error) {
      console.error('편지 불러오기 실패:', error);
      alert('편지를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 익명 보내기
  const sendLetter = async () => {
    if (!selectedFriend || !letterContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('letters')
        .insert([
          {
            friend_id: selectedFriend.id,
            content: letterContent
          }
        ]);

      if (error) throw error;
      
      alert('! 전송 성공 !');
      setLetterContent('');
      fetchLetters(selectedFriend.id); //새로고침
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
            이상한 거 보이면 삭제함
          </p>
        </div>

        <div style={{ display: 'flex', minHeight: '600px' }}>
          {/* 인원 목록 */}
          <div style={{
            width: '200px',
            backgroundColor: '#f4fff8ff',
            padding: '15px',
            borderRight: '1px solid #d1fae5'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#065f46' }}>인원 목록</h3>
            {friends.map(friend => (
              <div
                key={friend.id}
                onClick={() => selectFriend(friend)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: selectedFriend?.id === friend.id ? '#439043ff' : 'white',
                  color: selectedFriend?.id === friend.id ? 'white' : '#1e5d4bff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid #d1fae5',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedFriend?.id !== friend.id) {
                    e.target.style.backgroundColor = '#dcfce7';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFriend?.id !== friend.id) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                {friend.name}
              </div>
            ))}
          </div>

          {/* 메인 */}
          <div style={{ flex: 1, padding: '20px' }}>
            {!selectedFriend ? (
              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                marginTop: '100px'
              }}>
                <p style={{ fontSize: '18px' }}>빤쑤 선택</p>
              </div>
            ) : (
              <>
                <h2 style={{ margin: '0 0 20px 0', color: '#065f46' }}>
                  {selectedFriend.name}에게 익명편지
                </h2>
                
                {/* 익명 작성 */}
                <div style={{ marginBottom: '30px' }}>
                  <textarea
                    value={letterContent}
                    onChange={(e) => setLetterContent(e.target.value)}
                    placeholder="나쁜 말 쓰라고 만든 곳 아닌 거 알지"
                    style={{
                      width: '95%',
                      height: '120px',
                      padding: '15px',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
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

                {/* 받은 편지들 */}
                <div>
                  <h3 style={{ margin: '0 0 15px 0', color: '#065f46' }}>
                    {selectedFriend.name} 익명 편지 {letters.length}개
                  </h3>
                  
                  {loading ? (
                    <p style={{ color: '#6b7280' }}>로딩 중...</p>
                  ) : letters.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                      익명 좀 써줘~~
                    </p>
                  ) : (
                    <div>
                      {letters.map(letter => (
                        <div
                          key={letter.id}
                          style={{
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '10px'
                          }}
                        >
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            lineHeight: '1.5',
                            color: '#065f46'
                          }}>
                            {letter.content}
                          </p>
                          <small style={{ color: '#6b7280' }}>
                            {new Date(letter.created_at).toLocaleString('ko-KR')}
                          </small>
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