import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Eye, ThumbsUp, MessageSquare, Share2, AlertCircle, Reply, Heart, ShieldCheck, User as UserIcon } from 'lucide-react';
import { StorageService } from '../services/storage';
import { NewsInteractionService } from '../lib/newsInteractionService';
import { auth } from '../lib/firebase';
import BackToTop from './BackToTop';
import BackButton from './BackButton';

interface NewsDetailProps {
  news: any[];
  onRefresh: () => void;
  currentUser?: any;
}

export function NewsDetail({ news, onRefresh, currentUser }: NewsDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Realtime interaction states
  const [likesCount, setLikesCount] = useState(0);
  const [userLikedLikeId, setUserLikedLikeId] = useState<string | null>(null);
  const [commentsList, setCommentsList] = useState<any[]>([]);

  const viewIncrementedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      const foundArticle = news.find(n => n.id === parseInt(id));
      if (foundArticle) {
        setArticle(foundArticle);
        
        // Increment views only once per article visit to prevent infinite loops
        if (viewIncrementedRef.current !== id) {
          StorageService.incrementNewsViews(foundArticle.id);
          viewIncrementedRef.current = id;
          onRefresh();
        }
      }
    }
  }, [id, news]);

  // Realtime subscriptions
  useEffect(() => {
    if (!id) return;
    
    // Default userId from Firebase Auth (Anonymous login) matches request.auth.uid
    const userId = auth.currentUser?.uid;
    
    const unsubscribeLikes = NewsInteractionService.subscribeToLikes(id, (count, likedId) => {
      setLikesCount(count);
      setUserLikedLikeId(likedId);
    }, userId);

    const unsubscribeComments = NewsInteractionService.subscribeToComments(id, (comments) => {
      setCommentsList(comments);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [id, currentUser]);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Notizia non trovata</h2>
        <p className="text-slate-500 mt-2">La notizia che stai cercando potrebbe essere stata rimossa.</p>
        <div className="mt-6">
          <BackButton to="/" label="Torna alla Home" />
        </div>
      </div>
    );
  }

  const handleLike = async () => {
    if (!currentUser || !auth.currentUser?.uid) {
      alert("Accedi (tramite Portale) per esprimere la tua preferenza.");
      return;
    }
    const userId = auth.currentUser.uid;
    try {
      await NewsInteractionService.toggleLike(article.id, userId, userLikedLikeId);
    } catch (e) {
      alert("Errore nell'aggiornamento del like. Verifica la tua connessione.");
    }
  };

  const handleLikeComment = (commentId: number) => {
    StorageService.likeComment(article.id, commentId);
    onRefresh();
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !auth.currentUser?.uid) {
      alert("Devi accedere (tramite Portale) per poter commentare.");
      return;
    }
    
    if (newComment.trim()) {
      setIsSubmitting(true);
      const userName = `${currentUser.nome || ''} ${currentUser.cognome || ''}`.trim() || 'Utente';
      const userId = auth.currentUser.uid;
      
      try {
        await NewsInteractionService.addComment(article.id, userId, userName, newComment.trim());
        setNewComment('');
        setReplyToId(null);
      } catch (err) {
        alert("Si è verificato un errore durante la pubblicazione del tuo commento.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleShare = async () => {
    if (!article) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.titolo,
          text: article.descrizione_breve || article.titolo,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <BackToTop />
      <div className="mb-6">
        <BackButton to="/" label="Torna alle Notizie" />
      </div>

      <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {article.immagine_url && (
          <div className="w-full h-64 md:h-96 relative">
            <img 
              src={article.immagine_url} 
              alt={article.titolo} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {article.categoria && (
              <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                {article.categoria}
              </div>
            )}
          </div>
        )}

        <div className="p-6 md:p-10">
          {!article.immagine_url && article.categoria && (
            <div className="inline-block mb-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
              {article.categoria}
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
            {article.titolo}
          </h1>

          <div className="flex flex-wrap items-center text-sm text-slate-500 gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(article.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              {article.views || 0} visualizzazioni
            </div>
          </div>

          <div className="prose prose-slate prose-lg max-w-none mb-10">
            {(article.descrizione_lunga || article.contenuto || '').split('\n').map((paragraph: string, idx: number) => (
              <p key={idx} className="mb-4 text-slate-700 leading-relaxed">{paragraph}</p>
            ))}
          </div>

          <div className="flex items-center justify-between py-6 border-t border-slate-100">
            <div className="flex space-x-4">
              <button 
                onClick={handleLike}
                className={`flex items-center px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-full font-medium transition-colors ${
                  userLikedLikeId ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'
                }`}
              >
                <Heart className={`w-5 h-5 mr-2 ${userLikedLikeId ? 'fill-current' : ''}`} />
                {likesCount || 0} Mi piace
              </button>
              <button 
                onClick={handleShare}
                className={`flex items-center px-4 py-2 rounded-full font-medium transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
              >
                {copied ? (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" /> Copiato!
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5 mr-2" /> Condividi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 mb-20">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
            Dibattito Cittadino ({commentsList.length || 0})
          </h3>
          <div className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <ShieldCheck className="w-4 h-4 mr-1.5" /> IDENTITÀ VERIFICATA ATTIVA
          </div>
        </div>
        
        <form onSubmit={handleCommentSubmit} className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100 ring-1 ring-slate-200/50">
          {replyToId && currentUser && (
            <div className="flex justify-between items-center mb-3 text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold">
              <span>Stai rispondendo a un commento...</span>
              <button onClick={() => setReplyToId(null)} className="underline uppercase tracking-widest">Annulla</button>
            </div>
          )}
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <UserIcon className="w-5 h-5" />
             </div>
             <div className="flex-grow">
                {currentUser ? (
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commenta come <span className="text-blue-600">{currentUser?.nome} {currentUser?.cognome}</span></p>
                ) : (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Accesso richiesto per commentare</p>
                )}
                
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={currentUser ? (replyToId ? "Scrivi la tua risposta..." : "Esprimi un'opinione costruttiva o poni una domanda...") : "Devi effettuare l'accesso per partecipare al dibattito."}
                  className="w-full p-4 border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none text-slate-800 disabled:opacity-60 disabled:bg-slate-100"
                  rows={3}
                  required
                  disabled={!currentUser || isSubmitting}
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 font-medium max-w-[250px]">
                    Rispetta il regolamento comunale. I commenti offensivi verranno moderati e l'identità è tracciata.
                  </p>
                  <button 
                    type="submit"
                    disabled={!currentUser || isSubmitting}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Invio in corso...' : replyToId ? 'Rispondi' : 'Pubblica'}
                  </button>
                </div>
             </div>
          </div>
        </form>

        <div className="space-y-8">
          {commentsList && commentsList.some((c: any) => !c.parentId) ? (
            commentsList
              .filter((c: any) => !c.parentId)
              .map((comment: any) => {
                const replies = commentsList.filter((r: any) => r.parentId === comment.id);
                // For simplicity omitting nested replies in real-time or assume single level
                
                // Formatta il timestamp (potrebbe essere un oggettino Firebase se salvato da client o serverTimestamp)
                const dateVal = comment.createdAt?.toDate ? comment.createdAt.toDate() : (comment.createdAt ? new Date(comment.createdAt) : new Date());

                return (
                  <div key={comment.id} className="relative">
                    {/* Main Comment */}
                    <div className="p-6 rounded-2xl border transition-all bg-white border-slate-100 hover:border-slate-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 leading-none">{comment.userName || 'Cittadino Anonimo'}</h4>
                              <span className="flex items-center text-[9px] bg-slate-100 text-slate-500 font-black uppercase px-1.5 py-0.5 rounded leading-none border border-slate-200/50">Cittadino</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {dateVal.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-700 leading-relaxed mb-6 pl-1">{comment.textContent}</p>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="ml-8 mt-4 space-y-4 border-l-2 border-slate-100 pl-6">
                        {replies.map((reply: any) => {
                           const rDateVal = reply.createdAt?.toDate ? reply.createdAt.toDate() : (reply.createdAt ? new Date(reply.createdAt) : new Date());
                           return (
                             <div key={reply.id} className="p-5 bg-slate-50/50 border border-slate-100 rounded-xl">
                               <div className="flex items-center gap-3 mb-2">
                                 <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                                   <UserIcon className="w-4 h-4" />
                                 </div>
                                 <div>
                                   <h5 className="font-bold text-slate-800 text-sm leading-none">{reply.userName || 'Cittadino'}</h5>
                                   <span className="text-[9px] text-slate-400">
                                     {rDateVal.toLocaleDateString('it-IT')}
                                   </span>
                                 </div>
                               </div>
                               <p className="text-sm text-slate-600 leading-relaxed">{reply.textContent}</p>
                             </div>
                           );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nessun commento presente ancora.</p>
              <p className="text-xs text-slate-400 mt-1">Sii il primo ad avviare il dibattito!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
