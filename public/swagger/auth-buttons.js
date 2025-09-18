// 인증 버튼 추가 스크립트
function createAuthButtons() {
  if (document.getElementById('auth-buttons-container')) return;

    // 버튼 컨테이너 생성
    var container = document.createElement('div');
    container.id = 'auth-buttons-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '99999';
    container.style.background = 'white';
    container.style.padding = '15px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.style.border = '1px solid #ddd';

    // 로그인 버튼
    var loginBtn = document.createElement('button');
    loginBtn.id = 'login-btn';
    loginBtn.textContent = '🔐 Google 로그인';
    loginBtn.style.background = '#4285f4';
    loginBtn.style.color = 'white';
    loginBtn.style.border = 'none';
    loginBtn.style.padding = '10px 20px';
    loginBtn.style.borderRadius = '6px';
    loginBtn.style.marginRight = '10px';
    loginBtn.style.cursor = 'pointer';
    loginBtn.style.fontWeight = 'bold';
    loginBtn.style.fontSize = '14px';

    // 사용자 이름 표시
    var userNameSpan = document.createElement('span');
    userNameSpan.id = 'user-name';
    userNameSpan.style.marginRight = '10px';
    userNameSpan.style.fontWeight = 'bold';
    userNameSpan.style.color = '#333';
    userNameSpan.style.fontSize = '14px';
    userNameSpan.style.display = 'none';

    // 로그아웃 버튼
    var logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = '로그아웃';
    logoutBtn.style.background = '#4285f4';
    logoutBtn.style.color = 'white';
    logoutBtn.style.border = 'none';
    logoutBtn.style.padding = '10px 20px';
    logoutBtn.style.borderRadius = '6px';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.style.fontWeight = 'bold';
    logoutBtn.style.fontSize = '14px';
    logoutBtn.style.display = 'none';

    // 버튼 이벤트
    loginBtn.onclick = function() {
      window.isGoogleLoginInProgress = true;
      var popup = window.open('/auth/google', 'googleLogin', 'width=500,height=600,scrollbars=yes,resizable=yes');

      // 팝업 창 모니터링 (자동 닫힘 감지)
      var checkClosed = setInterval(function() {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.isGoogleLoginInProgress = false;
          // 창이 닫히면 상태 확인
          setTimeout(checkAuthStatus, 200);
        }
      }, 1000);
    };

    logoutBtn.onclick = function() {
      fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      .then(function(response) {
        if (response.ok) {
          // 즉시 UI 업데이트
          var userNameSpan = document.getElementById('user-name');
          loginBtn.style.display = 'inline-block';
          logoutBtn.style.display = 'none';
          if (userNameSpan) userNameSpan.style.display = 'none';
          // Swagger UI 인증 해제
          clearSwaggerAuth();
          window.isGoogleLoggedIn = false;
          console.log('✅ 구글 로그아웃 완료');
          alert('로그아웃 완료!');
          // 추가 상태 확인
          setTimeout(checkAuthStatus, 200);
        }
      })
      .catch(function(error) {
        console.error('로그아웃 오류:', error);
      });
    };

    // DOM에 추가
    container.appendChild(loginBtn);
    container.appendChild(userNameSpan);
    container.appendChild(logoutBtn);
    document.body.appendChild(container);

    // 즉시 인증 상태 확인
    checkAuthStatus();

    // 주기적으로 상태 확인 (10초마다)
    // setInterval(checkAuthStatus, 10000);

    // Swagger UI 인증 상태 감지
    startSwaggerAuthMonitoring();
}

function checkAuthStatus() {
  fetch('/auth/profile', { credentials: 'include' })
    .then(function(response) {
      var loginBtn = document.getElementById('login-btn');
      var logoutBtn = document.getElementById('logout-btn');
      var userNameSpan = document.getElementById('user-name');

      if (response.ok) {
        return response.json().then(function(userData) {
          if (loginBtn) loginBtn.style.display = 'none';
          if (logoutBtn) logoutBtn.style.display = 'inline-block';
          if (userNameSpan) {
            userNameSpan.style.display = 'inline-block';
            userNameSpan.textContent = userData.name || userData.email || '사용자';
          }
          window.isGoogleLoggedIn = true;
          console.log('✅ 구글 로그인 상태 확인됨');
        });
      } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userNameSpan) userNameSpan.style.display = 'none';
        window.isGoogleLoggedIn = false;
        console.log('❌ 구글 로그인 상태 아님');
      }

    })
    .catch(function(error) {
      var loginBtn = document.getElementById('login-btn');
      var logoutBtn = document.getElementById('logout-btn');
      var userNameSpan = document.getElementById('user-name');
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userNameSpan) userNameSpan.style.display = 'none';
      window.isGoogleLoggedIn = false;
      console.log('❌ 구글 로그인 상태 확인 실패');

    });
}

// 팝업에서 오는 메시지 리스너
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'LOGIN_SUCCESS') {
    console.log('로그인 성공 메시지 받음');
    window.isGoogleLoginInProgress = false;
    window.googleLoginJustCompleted = true;
    window.isGoogleLoggedIn = true;

    // 즉시 상태 업데이트
    setTimeout(checkAuthStatus, 100);
    setTimeout(checkAuthStatus, 500);
    // Swagger UI 인증 상태도 업데이트
    setTimeout(updateSwaggerAuth, 1000);

    // 5초 후 플래그 해제
    setTimeout(function() {
      window.googleLoginJustCompleted = false;
    }, 5000);
  }
});

// Swagger UI 인증 상태 업데이트 함수
function updateSwaggerAuth() {
  // 현재 쿠키에서 토큰 가져오기
  fetch('/auth/profile', { credentials: 'include' })
    .then(function(response) {
      if (response.ok) {
        // 토큰 생성 API로 새 토큰 가져오기
        return response.json();
      }
      throw new Error('Not authenticated');
    })
    .then(function(userData) {
      if (userData && userData.id) {
        // 사용자 ID로 토큰 생성
        return fetch('/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.id })
        });
      }
    })
    .then(function(response) {
      if (response && response.ok) {
        return response.json();
      }
    })
    .then(function(tokenData) {
      if (tokenData && tokenData.access_token) {
        // Swagger UI에 토큰 설정
        setSwaggerToken(tokenData.access_token);
        // 구글 로그인 상태 표시
        window.isGoogleLoggedIn = true;
      }
    })
    .catch(function(error) {
      console.log('Swagger 인증 업데이트 실패:', error);
    });
}

// Swagger UI에 토큰 설정하는 함수
function setSwaggerToken(token) {
  try {
    // Swagger UI의 전역 객체에 접근
    if (window.ui && window.ui.authActions) {
      window.ui.authActions.authorize({
        'JWT-auth': {
          name: 'JWT-auth',
          schema: {
            type: 'http',
            scheme: 'bearer'
          },
          value: token
        }
      });
      console.log('✅ Swagger UI 인증 설정 완료');
    } else {
      console.log('❌ Swagger UI 객체를 찾을 수 없음');
    }
  } catch (error) {
    console.error('Swagger 토큰 설정 오류:', error);
  }
}

// Swagger UI 인증 해제 함수
function clearSwaggerAuth() {
  try {
    if (window.ui && window.ui.authActions) {
      window.ui.authActions.logout(['JWT-auth']);
      console.log('Swagger UI 인증 해제 완료');
      window.isGoogleLoggedIn = false;
    }
  } catch (error) {
    console.error('Swagger 인증 해제 오류:', error);
  }
}

// Swagger UI 인증 상태 모니터링 시작 (단순화)
function startSwaggerAuthMonitoring() {
  console.log('ℹ️  Swagger UI 모니터링 기능이 단순화되었습니다.');
}

// 버튼 상태 업데이트 (단순화)
function updateButtonStates() {
  // 이 함수는 더 이상 상호 비활성화하지 않음
  console.log('ℹ️  버튼 상호 연동 기능이 제거되었습니다.');
}

// 구글 로그인 상태 해제 (쿠키만 삭제, 서버 로그아웃 X)
function logoutGoogle() {
  fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(function(response) {
    if (response.ok) {
      var loginBtn = document.getElementById('login-btn');
      var logoutBtn = document.getElementById('logout-btn');
      var userNameSpan = document.getElementById('user-name');
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userNameSpan) userNameSpan.style.display = 'none';
      window.isGoogleLoggedIn = false;
      console.log('✅ 구글 로그인 상태 해제 완료');
    }
  })
  .catch(function(error) {
    console.error('구글 로그아웃 오류:', error);
  });
}

// XMLHttpRequest 감시 설정 (Authorization 헤더 감지)
(function() {
  var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    if (name.toLowerCase() === 'authorization' && value) {
      window.lastAuthHeader = value;
      console.log('🔑 Authorization 헤더 감지:', value.substring(0, 20) + '...');
    }
    return originalSetRequestHeader.apply(this, arguments);
  };

  // fetch API도 감시
  var originalFetch = window.fetch;
  window.fetch = function() {
    var args = arguments;
    if (args[1] && args[1].headers) {
      var headers = args[1].headers;
      if (headers.Authorization || headers.authorization) {
        var authValue = headers.Authorization || headers.authorization;
        window.lastAuthHeader = authValue;
        console.log('🔑 Fetch Authorization 헤더 감지:', authValue.substring(0, 20) + '...');
      }
    }
    return originalFetch.apply(this, args);
  };
})();

// Auth 팝업 input 포커스 방지
function preventAuthInputFocus() {
  // MutationObserver로 auth 팝업 감지
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && node.classList && node.classList.contains('auth-container')) {
            // auth 팝업이 생성되면 input 완전 차단
            setTimeout(function() {
              var inputs = node.querySelectorAll('input');
              inputs.forEach(function(input) {
                input.disabled = true;
                input.readOnly = true;
              });

              var closeButton = node.querySelector('.close-modal') || node.querySelector('button');
              if (closeButton) {
                closeButton.focus();
              }
            }, 100);
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 여러 방법으로 버튼 생성 시도
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createAuthButtons);
  document.addEventListener('DOMContentLoaded', preventAuthInputFocus);
} else {
  createAuthButtons();
  preventAuthInputFocus();
}

window.addEventListener('load', createAuthButtons);
window.addEventListener('load', preventAuthInputFocus);
setTimeout(createAuthButtons, 100);
setTimeout(createAuthButtons, 500);